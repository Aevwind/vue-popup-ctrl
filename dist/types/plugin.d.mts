import { type PopupConfig, type PopupStore } from './store/popup.mjs';
import type { App } from 'vue';
import PopupCtrl from './components/PopupCtrl.vue.mjs';
declare module 'vue' {
    /** 彈窗組件 */
    function inject(key: 'popupStore'): PopupStore | undefined;
    interface GlobalComponents {
        PopupCtrl: typeof PopupCtrl;
    }
}
declare const PopupPlugin: {
    install(app: App, options?: PopupConfig): void;
};
export default PopupPlugin;
