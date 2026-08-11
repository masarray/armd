import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = path.join(root, "build", "app-icon.svg");
const iconDir = path.join(root, "build", "icons");
const publicDir = path.join(root, "public");
const indexPath = path.join(root, "index.html");

await mkdir(iconDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
const pngPaths = [];

for (const size of sizes) {
  const output = path.join(iconDir, `${size}x${size}.png`);
  await sharp(svgPath, { density: 768 })
    .resize(size, size, { fit: "contain" })
    .png({ compressionLevel: 9 })
    .toFile(output);
  pngPaths.push(output);
}

const icoSources = [16, 24, 32, 48, 64, 128, 256].map(
  (size) => path.join(iconDir, `${size}x${size}.png`),
);
const ico = await pngToIco(icoSources);
const icoPath = path.join(root, "build", "icon.ico");
await writeFile(icoPath, ico);

await copyFile(icoPath, path.join(publicDir, "favicon.ico"));
await copyFile(path.join(iconDir, "32x32.png"), path.join(publicDir, "favicon-32x32.png"));
await copyFile(path.join(iconDir, "256x256.png"), path.join(publicDir, "app-icon.png"));

// Make the supplied SVG the canonical browser favicon. This is deliberately
// idempotent so the script can run for local builds and in CI.
let html = await readFile(indexPath, "utf8");
const faviconTag = '    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />';
const iconLinkPattern = /^\s*<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*>\s*$/gim;

if (iconLinkPattern.test(html)) {
  html = html.replace(iconLinkPattern, faviconTag);
} else if (!html.includes('href="./favicon.svg"')) {
  html = html.replace(/<\/head>/i, `${faviconTag}\n  </head>`);
}
await writeFile(indexPath, html, "utf8");

console.log("ARMD release icons generated:");
console.log(`- Windows ICO: ${path.relative(root, icoPath)}`);
console.log(`- Linux icons: ${path.relative(root, iconDir)}`);
console.log("- Browser favicon: public/favicon.svg");
