// swPlugin.js - Vite build plugin that turns src/pwa/sw.js into dist/sw.js with
// the list of files to save offline and a version that changes on every deploy.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const listFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });

export function serviceWorker({ template = "src/pwa/sw.js" } = {}) {
  let publicDir = "public";
  return {
    name: "verifinews-service-worker",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle(_options, bundle) {
      const workerSource = readFileSync(resolve(template), "utf8");
      const hash = createHash("sha256").update(workerSource);
      const files = new Set();

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith(".map")) continue;
        files.add(fileName);
        hash.update(fileName).update(chunk.type === "chunk" ? chunk.code : chunk.source);
      }
      for (const full of listFiles(publicDir)) {
        const fileName = relative(publicDir, full).split("\\").join("/");
        if (fileName === "sw.js" || fileName === ".nojekyll") continue;
        files.add(fileName);
        hash.update(fileName).update(readFileSync(full));
      }
      files.add("index.html");

      const source = workerSource
        .replace('"__VERSION__"', JSON.stringify(hash.digest("hex").slice(0, 12)))
        .replace("__FILES__", JSON.stringify([...files].sort()));
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}
