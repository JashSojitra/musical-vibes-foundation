/** Preserve every inbound field location; never traverse a cross-dataset reference as local. */
export function referenceOrigins(documents) {
  const origins = [];
  function visit(value, path, document) {
    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        visit(item, `${path}[${index}]`, document),
      );
    } else if (value && typeof value === "object") {
      if (
        typeof value._ref === "string" &&
        !value._dataset &&
        !value._projectId
      ) {
        origins.push({
          document: document._id,
          type: document._type,
          revision: document._rev,
          path: `${path}._ref`,
          ref: value._ref,
        });
      }
      Object.entries(value).forEach(([key, item]) =>
        visit(item, path ? `${path}.${key}` : key, document),
      );
    }
  }
  documents.forEach((document) => visit(document, "", document));
  return origins;
}
