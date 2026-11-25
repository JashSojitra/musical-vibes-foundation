"use client";

import Image from "next/image";
import { useState } from "react";
import type { MediaAsset } from "@/types/content";

export default function ArchiveImage({
  photo,
  sizes,
}: {
  photo: MediaAsset;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span
      className="archive-image-unavailable"
      role="img"
      aria-label="Photograph unavailable"
    >
      Photograph unavailable
    </span>
  ) : (
    <Image
      src={photo.src}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      style={{ objectPosition: photo.position }}
      onError={() => setFailed(true)}
    />
  );
}
