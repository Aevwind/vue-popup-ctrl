// import {  defineAsyncComponent } from 'vue'
import type { App } from 'vue';
import usePopupStore, { type PopupConfig } from './store/popup.ts'
import PopupCtrl from './components/PopupCtrl.vue';

declare module 'vue' {
  /** 彈窗組件 */
  function inject(key: 'popupStore'): ReturnType<typeof usePopupStore>;
}

const Config = {
  install(app:App, options:PopupConfig = {}) {
    app.component('PopupCtrl', PopupCtrl);
    // 注册弹窗异步组件
    // const cmts = require.context('@cmt/popup', true, /\/.*?\.vue$/, 'lazy')
    // cmts.keys().forEach((key) => {
    //   const name = key.match(/\/([^\/]*?)\.vue$/)[1]
    //   if (!app?._context?.components[name]) {
    //     const syncCmt = defineAsyncComponent(() => cmts(key))
    //     app.component(name, syncCmt)
    //   }
    // })
    app.provide('popupStore', usePopupStore(options));
  }
};

export default Config;

export { usePopupStore,  type PopupConfig };
