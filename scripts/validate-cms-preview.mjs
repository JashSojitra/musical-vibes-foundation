import { validateBundle, workerName } from "./cms-preview-config.mjs";
validateBundle();
console.log(
  `${workerName}: isolated target, no domain routes, public-only configuration and CMS build receipt verified.`,
);
