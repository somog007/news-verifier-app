import { describe, expect, it } from "vitest";
import { serviceWorker } from "./swPlugin";

function build(bundle) {
  const plugin = serviceWorker();
  plugin.configResolved({ publicDir: "public" });
  let emitted;
  plugin.generateBundle.call({ emitFile: (file) => (emitted = file) }, {}, bundle);
  return emitted;
}

const fileList = (source) => JSON.parse(source.match(/const FILES = (\[.*?\]);/)[1]);
const version = (source) => source.match(/const VERSION = "(\w+)";/)[1];

describe("service worker build plugin", () => {
  const bundle = {
    "assets/index-abc.js": { type: "chunk", code: "console.log(1)" },
    "assets/index-abc.js.map": { type: "asset", source: "{}" },
    "assets/index-def.css": { type: "asset", source: "body{}" },
  };

  it("lists the built files, public files and index.html, but not source maps", () => {
    const sw = build(bundle);
    expect(sw.fileName).toBe("sw.js");
    const files = fileList(sw.source);
    expect(files).toEqual(expect.arrayContaining(["assets/index-abc.js", "assets/index-def.css", "index.html", "manifest.webmanifest", "icons/icon-192.png"]));
    expect(files).not.toContain("assets/index-abc.js.map");
  });

  it("changes the version when the app's code changes", () => {
    const before = version(build(bundle).source);
    const after = version(build({ ...bundle, "assets/index-abc.js": { type: "chunk", code: "console.log(2)" } }).source);
    expect(after).not.toBe(before);
    expect(version(build(bundle).source)).toBe(before);
  });
});
