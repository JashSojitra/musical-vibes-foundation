export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export const demoHeaders = {
  ...securityHeaders,
  "X-Robots-Tag": "noindex, nofollow",
};

/** Cloudflare replaces duplicate path blocks; keep all preview policies together. */
export function previewAssetHeaders(base) {
  const lines = base.replaceAll("\r\n", "\n").trimEnd().split("\n");
  const globals = lines.flatMap((line, index) =>
    line === "/*" ? [index] : [],
  );
  if (globals.length !== 1)
    throw new Error("Expected one shared static security header block");
  const start = globals[0];
  let end = start + 1;
  while (end < lines.length && /^\s+\S/.test(lines[end])) end++;
  const block = lines.slice(start + 1, end).map((line) => line.trim());
  if (
    !Object.entries(securityHeaders).every(([key, value]) =>
      block.includes(`${key}: ${value}`),
    ) ||
    lines.some((line) => /^\s*X-Robots-Tag:/i.test(line))
  )
    throw new Error("Invalid shared static security/indexing policy");
  lines.splice(end, 0, `  X-Robots-Tag: ${demoHeaders["X-Robots-Tag"]}`);
  return lines.join("\n") + "\n";
}
