import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const release = join(root, 'release')
const filename = 'Jacaranda-Bookshop-Mobile.html'

const result = await build({
  root,
  configFile: false,
  publicDir: false,
  base: './',
  build: {
    write: false,
    assetsInlineLimit: () => true,
    cssCodeSplit: false,
    modulePreload: false,
    rolldownOptions: { output: { format: 'iife', codeSplitting: false } },
    reportCompressedSize: false,
  },
})

const entry = result.output.find((file) => file.type === 'chunk' && file.isEntry)
const stylesheet = result.output.find((file) => file.fileName.endsWith('.css'))
const index = result.output.find((file) => file.fileName === 'index.html')
assert.ok(entry && stylesheet && index && result.output.length === 3, 'Expected only one HTML, CSS and JS output')
assert.equal(entry.imports.length + entry.dynamicImports.length, 0, 'Mobile entry must contain all dependencies')

const [cover, creditsPage, ...notices] = await Promise.all([
  readFile(join(root, 'src/styles/twilight-poster.webp')),
  ...[
    'public/licenses/Soundtrack.html',
    'node_modules/three/LICENSE',
    'public/licenses/PinyonScript-OFL.txt',
    'public/licenses/CormorantGaramond-OFL.txt',
  ].map((name) => readFile(join(root, name), 'utf8')),
])
const creditsBody = creditsPage.match(/<main>([\s\S]*?)<\/main>/)?.[1]
assert.ok(creditsBody, 'Could not find the soundtrack credits')
const creditContent = creditsBody.replace(/<p><a href="\.\.\/index\.html">返回书店<\/a><\/p>/, '')
const escapeHTML = (source) => source.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const dialog = `<dialog id="mobile-credits" aria-label="署名与许可">
  ${creditContent}
  <details>
    <summary>Three.js 与字体许可原文</summary>
    <pre>${escapeHTML(notices.join('\n\n'))}</pre>
  </details>
  <form method="dialog"><button type="submit" autofocus>关闭</button></form>
</dialog>`

const dialogStyles = `
#mobile-credits {
  width: min(92vw, 38rem); max-height: 86vh; padding: 1.2rem;
  color: var(--ink); background: var(--paper); border: 1px solid var(--line); border-radius: 6px; line-height: 1.5;
}
#mobile-credits::backdrop { background: #25233299; }
#mobile-credits ul { padding-inline-start: 1.25rem; }
#mobile-credits a { color: var(--sage); }
#mobile-credits p + details, #mobile-credits form { margin-top: 0.9rem; }
#mobile-credits pre { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 0.78rem; }
`

const runCredits = `
document.querySelector('#mobile-poster')?.remove();
document.querySelector('.music-credits').addEventListener('click', (event) => {
  event.preventDefault();
  document.querySelector('#mobile-credits').showModal();
});
`

let html = String(index.source)
function replaceMarker(marker, output) {
  assert.ok(html.includes(marker), `Missing HTML marker: ${marker}`)
  html = html.replace(marker, () => output)
}

replaceMarker(`<script type="module" crossorigin src="./${entry.fileName}"></script>`, '')
replaceMarker(`<link rel="stylesheet" crossorigin href="./${stylesheet.fileName}">`, `<style>${stylesheet.source}${dialogStyles}</style>`)
replaceMarker('<div id="scene"></div>',
  `<div id="scene"><img id="mobile-poster" src="data:image/webp;base64,${cover.toString('base64')}" alt="傍晚的蓝花楹书店"></div>`)
replaceMarker('正在准备场景…', '静态预览 · 在支持 WebGL 2 的浏览器中打开可互动。')
replaceMarker('href="./licenses/Soundtrack.html" lang="en" target="_blank" rel="noopener"', 'href="#mobile-credits" lang="en"')
const inlineScript = `${entry.code}\n${runCredits}`.replace(/<\/script/gi, '<\\/script')
replaceMarker('</body>', `${dialog}\n<script>${inlineScript}</script>\n</body>`)

await mkdir(release, { recursive: true })
const staging = await mkdtemp(join(release, '.mobile-'))
try {
  await writeFile(join(staging, filename), html)
  await rename(join(staging, filename), join(release, filename))
} finally {
  await rm(staging, { recursive: true, force: true })
}
console.log(`release/${filename} · ${(Buffer.byteLength(html) / 1024 ** 2).toFixed(2)} MiB`)
