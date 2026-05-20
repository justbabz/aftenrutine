import { readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";

const SOURCE = "public/icons/icon-source.svg";
const TARGETS = [
  { out: "public/icons/icon-192.png", size: 192 },
  { out: "public/icons/icon-512.png", size: 512 },
];

const svg = await readFile(SOURCE, "utf8");
for (const { out, size } of TARGETS) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
  await writeFile(out, png);
  console.log(`✓ ${out} (${png.length} bytes)`);
}
