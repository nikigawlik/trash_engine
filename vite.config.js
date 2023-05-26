import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'path'
import mkcert from 'vite-plugin-mkcert'
import { readFileSync } from 'fs'



// https://vitejs.dev/config/
export default defineConfig({
  // plugins: [svelte(), viteSingleFile({ useRecommendedBuildConfig: false })],
  // plugins: [svelte()],
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
