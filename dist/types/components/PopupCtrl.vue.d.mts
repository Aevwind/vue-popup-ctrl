import type { PopupConfig } from '../store/popup.mjs';
interface PopupCtrlProps {
    /** 點擊遮罩關閉 */
    maskClose?: boolean;
    /** 遮罩颜色 */
    maskColor?: string;
    /** 開啟背景模糊, body下元素添加dis_popup_blur類名可不模糊 */
    bgBlur?: boolean;
    /** 背景透明度 */
    opacity?: number;
    /** 弹窗配置默认配置, 只在非插件模式下生效 **/
    popupConfig?: PopupConfig;
}
declare const __VLS_export: import("vue").DefineComponent<PopupCtrlProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<PopupCtrlProps> & Readonly<{}>, {
    opacity: number;
    maskClose: boolean;
    maskColor: string;
    bgBlur: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const _default: typeof __VLS_export;
export default _default;
