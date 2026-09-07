import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],

  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'VuePopupCtrl',
      fileName: 'vue-popup-ctrl',
      cssFileName: 'vue-popup-ctrl'
    },

    rolldownOptions: {
      external: ['vue'],

      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})