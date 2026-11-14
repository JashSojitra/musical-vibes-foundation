/** Diagnose publication gates without granting approval or reading drafts. */
export function mediaVisibility(documents, origins) {
  const withheld = documents
    .filter((doc) => doc._type === "mediaItem")
    .flatMap((doc) => {
      const reasons = [];
      if (doc.editorialApproval !== "approved") reasons.push("not-approved");
      if (doc.publicationEnabled !== true) reasons.push("publication-disabled");
      return reasons.length ? [{ id: doc._id, reasons }] : [];
    });
  const ids = new Set(withheld.map((item) => item.id));
  return {
    // Readable documents and uploaded assets are not necessarily publishable photos.
    readableMedia: documents.filter((doc) => doc._type === "mediaItem").length,
    withheldMedia: withheld,
    withheldReferenceOrigins: origins.filter((origin) => ids.has(origin.ref)),
  };
}
