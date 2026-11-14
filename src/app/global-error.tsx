"use client";

// This boundary also handles a failed CMS read in the root layout.
// Never display the underlying error or private service response.
export default function GlobalError() {
  return (
    <html lang="en-CA">
      <body>
        <main>
          <h1>We couldn’t load the website.</h1>
          <p>Please try again in a moment.</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </main>
      </body>
    </html>
  );
}
