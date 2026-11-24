import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function pagesFallback(): Plugin {
  let outputDirectory: string
  return {
    name: 'github-pages-fallback',
    apply: 'build',
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      await copyFile(resolve(outputDirectory, 'index.html'), resolve(outputDirectory, '404.html'))
    },
  }
}

const basePath = process.env.PAGES_BASE_PATH?.replace(/\/+$/, '') ?? ''

export default defineConfig({
  base: `${basePath}/`,
  plugins: [react(), pagesFallback()],
})
