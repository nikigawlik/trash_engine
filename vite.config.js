import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'fs'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [mkcert(), svelte(), viteSingleFile()],
  base: "",
  server: {
    https: true,
  },
  build: {
    rollupOptions: {
      output: {
        dir: getOutputDir(),
      },
    },
    minify: false
  }
})

function getOutputDir() {
  const packageJson = JSON.parse(readFileSync('./package.json'));
  const version = packageJson.version;

  return `dist/${version}`;
}
