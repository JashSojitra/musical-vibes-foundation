import { useEffect, useRef, useState } from "react";
import {
  insert,
  set,
  setIfMissing,
  useClient,
  type ArrayOfObjectsInputProps,
} from "sanity";

type Upload = {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

function UploadPreview({ file }: { file: File }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  // Studio-local object URLs cannot use Next Image.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={image}
      alt=""
      width={64}
      height={64}
      style={{ objectFit: "cover" }}
    />
  );
}

/** Assets are uploaded through the Studio client; only keyed inserts touch the document. */
export function StoryPhotosInput(
  props: ArrayOfObjectsInputProps<{
    _key: string;
    cover?: boolean;
    caption?: string;
  }>,
) {
  const client = useClient({ apiVersion: "2026-11-01" });
  const [uploads, setUploads] = useState<Upload[]>([]);
  const busy = useRef(false);
  const inFlight = useRef(new Set<string>());
  const update = (id: string, patch: Partial<Upload>) =>
    setUploads((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  async function upload(item: Upload) {
    if (inFlight.current.has(item.id)) return;
    inFlight.current.add(item.id);
    update(item.id, { status: "uploading", progress: 0, error: undefined });
    await new Promise<void>((resolve) => {
      client.observable.assets
        .upload("image", item.file, { filename: item.file.name })
        .subscribe({
          next: (event) => {
            if (event.type === "progress")
              update(item.id, { progress: event.percent });
            if (event.type === "response") {
              props.onChange([
                setIfMissing([]),
                insert(
                  [
                    {
                      _type: "image",
                      _key: item.id,
                      asset: {
                        _type: "reference",
                        _ref: event.body.document._id,
                      },
                    },
                  ],
                  "after",
                  [-1],
                ),
              ]);
              update(item.id, { status: "done", progress: 100 });
            }
          },
          error: (error: Error) => {
            update(item.id, { status: "error", error: error.message });
            resolve();
          },
          complete: resolve,
        });
    });
    inFlight.current.delete(item.id);
  }
  return (
    <div>
      <label>
        Choose photographs (multiple files allowed)
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={
            props.readOnly || uploads.some((u) => u.status === "uploading")
          }
          onChange={async (event) => {
            const files = Array.from(event.currentTarget.files || []);
            event.currentTarget.value = "";
            if (busy.current) return;
            busy.current = true;
            const items: Upload[] = files.map((file) => ({
              id: crypto.randomUUID().replaceAll("-", ""),
              file,
              progress: 0,
              status: "uploading",
            }));
            setUploads((previous) => [...previous, ...items]);
            try {
              for (const item of items) await upload(item);
            } finally {
              busy.current = false;
            }
          }}
        />
      </label>
      <p>
        First photo is the default cover. Drag thumbnails below to reorder; open
        a photo to edit its optional description or caption. Select a cover
        below. Uploading saves a draft; Publish makes the story visible.
      </p>
      <ul aria-live="polite">
        {uploads.map((item) => (
          <li key={item.id}>
            <UploadPreview file={item.file} />
            {item.file.name}:{" "}
            {item.status === "done"
              ? "Uploaded"
              : item.status === "error"
                ? "Upload failed"
                : `${Math.round(item.progress)}%`}
            {item.status === "uploading" ? (
              <progress
                max={100}
                value={item.progress}
                aria-label={`Uploading ${item.file.name}`}
              />
            ) : null}
            {item.status === "error" ? (
              <>
                <span role="alert">{item.error}</span>
                <button
                  type="button"
                  disabled={props.readOnly}
                  onClick={() => void upload(item)}
                >
                  Retry {item.file.name}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUploads((all) => all.filter((u) => u.id !== item.id))
                  }
                >
                  Clear error
                </button>
              </>
            ) : null}
          </li>
        ))}
      </ul>
      {props.value?.length ? (
        <fieldset disabled={props.readOnly}>
          <legend>Cover photograph (select one)</legend>
          {props.value.map((photo, index) => (
            <label key={photo._key} style={{ display: "block" }}>
              <input
                type="radio"
                name={`cover-${props.id}`}
                checked={
                  photo.cover === true ||
                  (!props.value?.some((p) => p.cover === true) && index === 0)
                }
                onChange={() =>
                  props.onChange(
                    (props.value || []).map((p) =>
                      set(p._key === photo._key, [{ _key: p._key }, "cover"]),
                    ),
                  )
                }
              />
              Photograph {index + 1}
              {typeof photo.caption === "string" ? ` — ${photo.caption}` : ""}
            </label>
          ))}
        </fieldset>
      ) : null}
      {props.renderDefault(props)}
    </div>
  );
}
