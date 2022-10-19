import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // plugins: [svelte(), viteSingleFile({ useRecommendedBuildConfig: false })],
  plugins: [svelte(), viteSingleFile()],
  // plugins: [svelte()],
  base: "",
  build: {
    // rollupOptions: {
    //   input: {
    //     main: resolve(__dirname, 'index.html'),
    //     game: resolve(__dirname, 'game.html')
    //   }
    // },
    minify: false
  }
})
