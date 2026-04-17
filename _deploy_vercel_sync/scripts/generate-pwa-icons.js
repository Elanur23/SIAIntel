/**
 * Generate PWA PNG icons from icon.svg
 * Run: node scripts/generate-pwa-icons.js
 */
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const publicDir = path.join(__dirname, '..', 'public')
const iconsDir = path.join(publicDir, 'icons')
const svgPath = path.join(publicDir, 'icon.svg')

const sizes = [192, 512]

async function generate() {
  if (!fs.existsSync(svgPath)) {
    console.error('icon.svg not found in public/')
    process.exit(1)
  }
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

  for (const size of sizes) {
    const outPath = path.join(iconsDir, `icon-${size}x${size}.png`)
    await sharp(svgPath).resize(size, size).png().toFile(outPath)
    console.log(`Created ${outPath}`)
  }
  console.log('PWA icons generated.')
}

generate().catch((err) => {
  console.error(err)
  process.exit(1)
})
