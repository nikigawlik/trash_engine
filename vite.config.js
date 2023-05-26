import { svelte } from '@sveltejs/vite-plugin-svelte'
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
    minify: false
  }
})
