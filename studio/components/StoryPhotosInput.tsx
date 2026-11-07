import { useCallback } from "react";
import {
  type ArrayOfObjectsInputProps,
  useDocumentOperation,
  useFormValue,
} from "sanity";

/** Every photo edit starts a new rights review; existing legacy approvals are untouched. */
export function StoryPhotosInput(props: ArrayOfObjectsInputProps) {
  const id = useFormValue(["_id"]) as string;
  const type = useFormValue(["_type"]) as string;
  const { patch } = useDocumentOperation(id.replace(/^drafts\./, ""), type);
  const onChange = useCallback(
    (event: Parameters<ArrayOfObjectsInputProps["onChange"]>[0]) => {
      props.onChange(event);
      patch.execute([{ unset: ["photoRightsConfirmed"] }]);
    },
    [props, patch],
  );
  return props.renderDefault({ ...props, onChange });
}
