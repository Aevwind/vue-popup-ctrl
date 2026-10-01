import { type PopupConfig, type PopupStore } from './store/popup.js';
import type { App } from 'vue';
import PopupCtrl from './components/PopupCtrl.vue.js';
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
