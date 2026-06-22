import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const root = fileURLToPath(new URL("..", import.meta.url))
const outDir = path.join(root, "public", "icons")

await mkdir(outDir, { recursive: true })

const targets = [
  { input: "public/favicon.svg", output: "icons/icon-192.png", size: 192 },
  { input: "public/favicon.svg", output: "icons/icon-512.png", size: 512 },
  { input: "public/favicon.svg", output: "icons/apple-touch-icon.png", size: 180 },
  { input: "public/icon-maskable.svg", output: "icons/icon-maskable-512.png", size: 512 },
]

for (const { input, output, size } of targets) {
  await sharp(path.join(root, input))
    .resize(size, size)
    .png()
    .toFile(path.join(root, "public", output))
  console.log(`Generated ${output} (${size}x${size})`)
}
