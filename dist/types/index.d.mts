import type { App } from 'vue';
import usePopupStore, { type PopupConfig, type PopupStore } from './store/popup.mjs';
import PopupCtrl from './components/PopupCtrl.vue.mjs';
declare module 'vue' {
    /** 彈窗組件 */
    function inject(key: 'popupStore'): PopupStore | undefined;
    interface GlobalComponents {
        PopupCtrl: typeof PopupCtrl;
    }
}
declare const Config: {
    install(app: App, options?: PopupConfig): void;
};
export default Config;
export { PopupCtrl, usePopupStore, type PopupConfig, type PopupStore };
export type { ToastConfig } from './store/popup.mjs';
