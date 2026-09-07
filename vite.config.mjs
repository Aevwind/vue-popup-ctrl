import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

// 浏览器入口关联 CSS，Node 入口继续使用不导入 CSS 的原始构建。
function browserStyleEntries() {
  return {
    name: 'vue-popup-ctrl-browser-styles',
    apply: 'build',
    generateBundle(options, bundle) {
      const entry = Object.values(bundle).find(file => file.type === 'chunk' && file.isEntry)
      if (!entry) this.error('Missing vue-popup-ctrl library entry')
      if (options.format === 'es') {
        this.emitFile({
          type: 'asset',
          fileName: 'vue-popup-ctrl.browser.mjs',
          source: `import './vue-popup-ctrl.css';\nexport * from './${entry.fileName}';\nexport { default } from './${entry.fileName}';\n`,
        })
      } else if (options.format === 'umd') {
        this.emitFile({
          type: 'asset',
          fileName: 'vue-popup-ctrl.browser.cjs',
          source: `require('./vue-popup-ctrl.css');\nmodule.exports = require('./${entry.fileName}');\n`,
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [vue(), browserStyleEntries()],

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
        exports: 'named',
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
