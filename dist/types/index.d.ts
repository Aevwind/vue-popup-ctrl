import type { App, DefineComponent } from 'vue';
import usePopupStore, { type PopupConfig, type PopupStore } from './store/popup.js';
export interface PopupCtrlProps {
    maskClose?: boolean;
    maskColor?: string;
    bgBlur?: boolean;
    opacity?: number;
}
declare const PopupCtrl: DefineComponent<PopupCtrlProps>;
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
export type { ToastConfig } from './store/popup.js';
