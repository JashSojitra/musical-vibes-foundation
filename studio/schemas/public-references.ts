/** Allow normal root IDs and their drafts, but never retained private-path copies. */
export const publicReferenceOptions = {
  filter:
    'count(string::split(_id, ".")) == 1 || (_id in path("drafts.*") && count(string::split(_id, ".")) == 2)',
};

export function validatePublicReference(value: unknown) {
  const ref = (value as { _ref?: string } | undefined)?._ref;
  return !ref || !ref.includes(".")
    ? true
    : "Select the public copy of this record; this legacy or draft reference is inaccessible on the website.";
}
