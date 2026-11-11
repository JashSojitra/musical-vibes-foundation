// Exact legacy HTML routes verified against the preserved Hostinger inventory.
export const legacyRoutes = Object.freeze({
  "/index.html": "/",
  "/pages/about.html": "/about",
  "/pages/program.html": "/programs",
  "/pages/contact.html": "/contact",
  "/pages/gallery.html": "/gallery",
  "/pages/galleryseniors.html": "/gallery",
  "/pages/gallerymusicalvibes.html": "/gallery",
});
export function legacyRedirect(request) {
  const url = new URL(request.url);
  const destination = legacyRoutes[url.pathname];
  if (!destination || !["GET", "HEAD"].includes(request.method)) return null;
  url.pathname = destination;
  // Keep query parameters and the serving origin; no arbitrary Location input.
  return Response.redirect(url.toString(), 308);
}
