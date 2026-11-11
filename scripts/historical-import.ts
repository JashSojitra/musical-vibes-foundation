import { loadBackup } from "./sanity-repair";
import { ImportError } from "./historical-import.mjs";
import { runCLI } from "./historical-import-cli.mjs";
runCLI(process.argv.slice(2), { loadBackup }).catch((error: unknown) => {
  // SDK/network/parse exceptions may contain private values; only our fixed errors are printable.
  const code = (error as NodeJS.ErrnoException)?.code;
  const reason =
    error instanceof ImportError
      ? error.message
      : [
            "ENOENT",
            "EACCES",
            "EPERM",
            "EEXIST",
            "ENOTDIR",
            "EISDIR",
            "ENOSPC",
          ].includes(code || "")
        ? `Local filesystem failure (${code}). Check input files, run-directory locks and Windows permissions; retain checkpoints.`
        : "Check private inputs and permissions; retain checkpoints and reconcile uncertain writes.";
  console.error(
    `Historical importer stopped. ${reason} See docs/HISTORICAL-IMPORT.md.`,
  );
  process.exitCode = 1;
});
