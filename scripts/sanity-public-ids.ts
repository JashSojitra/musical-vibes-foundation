/** Sanity's anonymous reader cannot access IDs containing periods (private paths). */
export function publicContentId(sourceId: string): string {
  const id = `mvf-${Buffer.from(sourceId, "utf8").toString("base64url")}`;
  if (id.length > 128)
    throw new Error(`Source ID exceeds Sanity's ID limit: ${sourceId}`);
  return id;
}

export function assertNoLegacyPathIds(
  existingIds: string[],
  legacyIds: Set<string>,
) {
  const occupied = existingIds.filter((id) =>
    legacyIds.has(id.replace(/^drafts\./, "")),
  );
  if (occupied.length)
    throw new Error(
      `Legacy private-path IDs already exist (${occupied.join(", ")}). Stop: this importer cannot repair them. A separately authorized ID/reference migration is required; no writes were performed.`,
    );
}
