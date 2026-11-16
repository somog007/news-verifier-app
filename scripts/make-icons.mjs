// Renders public/favicon.svg and the PNG app icons with a headless Chrome or Edge.
// Usage: node scripts/make-icons.mjs [path-to-chrome-or-edge]
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { iconSvg } from "./icon-source.mjs";

const candidates = [
  process.argv[2],
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const browser = candidates.find((p) => existsSync(p));
if (!browser) throw new Error("No Chrome or Edge found; pass its path as an argument.");

const root = resolve(import.meta.dirname, "..");
writeFileSync(join(root, "public/favicon.svg"), iconSvg());

const work = mkdtempSync(join(tmpdir(), "verifinews-icons-"));
const outputs = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: true },
];
for (const { file, size, maskable } of outputs) {
  const html = join(work, `${file}.html`);
  writeFileSync(html, `<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${iconSvg({ maskable })}`);
  execFileSync(browser, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    "--default-background-color=00000000", `--window-size=${size},${size}`,
    `--screenshot=${join(root, "public/icons", file)}`, pathToFileURL(html).href,
  ], { stdio: "ignore", timeout: 60_000 });
  console.log(`public/icons/${file}`);
}
