// import {  defineAsyncComponent } from 'vue'
import type { App, DefineComponent } from 'vue';
import usePopupStore, { type PopupConfig, type PopupStore } from './store/popup.js';
import PopupCtrlComponent from './components/PopupCtrl.vue';

export interface PopupCtrlProps {
  maskClose?: boolean;
  maskColor?: string;
  bgBlur?: boolean;
  opacity?: number;
}

// 公开稳定的组件签名，避免把当前 Vue 编译器的内部泛型参数写入入口声明。
const PopupCtrl = PopupCtrlComponent as DefineComponent<PopupCtrlProps>;

declare module 'vue' {
  /** 彈窗組件 */
  function inject(key: 'popupStore'): PopupStore | undefined;
  interface GlobalComponents {
    PopupCtrl: typeof PopupCtrl;
  }
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

export { PopupCtrl, usePopupStore, type PopupConfig, type PopupStore };
export type { ToastConfig } from './store/popup.js';
