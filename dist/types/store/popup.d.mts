import type { StyleValue, TransitionProps } from 'vue';
import type { DefineEmits, DefineProps, PopupInstance, ComponentName, PopupData, PopupCacheCheck, PopupOpenArgs, PopupInput, PopupCreateData, PopupReuseData } from './popup.types.mjs';
/**
 * 彈窗配置
 */
export interface PopupConfig {
    /** 弹窗类型 */
    type?: 'daily' | 'once' | '';
    /** 只能存在一個相同彈窗 */
    only?: boolean;
    /** 動畫效果
     * - bounce: 彈跳
     * - bottom: 從底部彈起
     * - boom: 爆炸效果
     * - light: 闪光效果
     */
    anime?: 'bounce' | 'bottom' | 'boom' | 'none' | 'light' | 'confetti';
    /** 透明度 */
    opacity?: number;
    /** 層級 */
    zIndex?: number;
    /** 點擊遮罩關閉 */
    maskClose?: boolean;
    /** 遮罩顏色 */
    maskColor?: string;
    /**
     * 外层弹窗容器类名
     */
    rootClassName?: string;
    /** 遮罩樣式 */
    maskStyle?: StyleValue;
    /** 禮炮特效配置 */
    confettiConf?: [
        {
            /**
             * 礼花数量
             */
            particleCount: number;
            /**
             * 礼花扩散
             */
            spread: number;
            /**
             * 礼花起始位置
             */
            origin: {
                y: number;
            };
            /**
             * 礼花层级
             */
            zIndex: number;
        }
    ];
}
/** 所有彈窗組件 */
/** 所有彈窗组件名稱 */
/** 获取vue组件参数 */
/** 获取参数 */
type GetObjectParams<T, K, D = never> = K extends keyof T ? Pick<T, K>[K] : D;
type GetFunctionParams<T, K = never, D = never> = T extends (...args: any[]) => any ? K extends number ? Parameters<T>[K] : Parameters<T> : D;
/** 获取组件props */
/** 关闭窗口emit事件 */
type DefaultEmitEvent = {
    close: (cb: () => void, ...args: any[]) => void;
};
/** 获取组件emit */
/** 對外統一返回的響應式彈窗句柄 */
type ReturnPopupObject<Name extends string = string, Data = PopupData<Name>> = Omit<PopupObject<Name, Data>, 'show' | 'ref'> & {
    show: boolean;
    ref: PopupInstance<Name> | undefined;
};
declare function deepMerge<T extends Record<string, any>, T1 extends Record<string, any>>(target: T | undefined, source: T1, copies?: WeakMap<object, any>): T & T1;
type ReadonlyConfig<T, Depth extends unknown[] = []> = Depth['length'] extends 5 ? T : T extends object ? {
    readonly [K in keyof T]: ReadonlyConfig<T[K], [...Depth, unknown]>;
} : T;
/** 创建弹窗对象 */
declare class PopupObject<Name extends string, Data = PopupData<Name>> {
    /** 簡單合併兩個對象 */
    static deepMerge: typeof deepMerge;
    show: import("vue").Ref<boolean, boolean>;
    /** 彈窗id */
    id: number;
    /** 弹窗名称 */
    name: ComponentName<Name>;
    /** 完整名称，用于区分 query 不同的弹窗。 */
    key: string;
    /** 弹窗数据 */
    data: Data;
    /** 彈窗組件 */
    ref: import("vue").Ref<PopupInstance<Name> | undefined, PopupInstance<Name> | undefined>;
    /** disabled */
    disabled: boolean;
    /** 是否正在關閉 */
    closing: boolean;
    transitionConfig: TransitionProps;
    /** 配置 */
    option: PopupConfig;
    /** 同步 close 回调中再次调用句柄 close() 时直接关闭，避免递归。 */
    private closeEventDepth;
    /** 窗口控制方法掛載 */
    private closeCtrlFn;
    /** 事件列表 **/
    event: Record<string, ((...args: any[]) => any)[]>;
    private listeners;
    /**
     *
     * @param id 彈窗id
     * @param name 彈窗組件名
     * @param data 彈窗props數據
     * @param option 彈窗配置
     * @param closeCtrlFn 關閉控制方法
     */
    constructor(id: number, name: ComponentName<Name>, props: Data, option: PopupConfig, closeCtrlFn: (...args: any[]) => any, key?: string);
    /** 初始化彈窗動畫參數 */
    initTransitionConfig(): void;
    private addListener;
    /**
     * 註冊監聽$emit事件, 返回promise,主要方便用于try catch的方式使用
     * @param event 事件名
     * @returns { Promise } 彈窗對象
     */
    on<EventType extends string>(event: keyof DefaultEmitEvent | keyof DefineEmits<Name> | EventType): Promise<GetFunctionParams<GetObjectParams<DefaultEmitEvent, EventType, GetObjectParams<DefineEmits<Name>, EventType, (...args: any[]) => any>>, 0> | undefined>;
    /**
     * 註冊監聽$emit事件, 觸發在組件上使用$emit('事件名')觸發事件
     * @param event 事件名
     * @param callback 事件回調
     * @returns { PopupObject } 彈窗對象
     */
    on<EventType extends string>(event: keyof DefaultEmitEvent | keyof DefineEmits<Name> | EventType, callback: GetObjectParams<DefaultEmitEvent, EventType, GetObjectParams<DefineEmits<Name>, EventType, (...args: any[]) => void>>): ReturnPopupObject<Name, Data>;
    /**
     * 解綁監聽$emit事件
     * @param event 事件名
     * @param callback 註冊事件時使用的函數
     * @returns { PopupObject } 彈窗對象
     */
    un<EventType extends string>(event: keyof DefaultEmitEvent | keyof DefineEmits<Name> | EventType, func: any): ReturnPopupObject<Name, Data>;
    /**
     * 獲取組件實例
     * @param el 組件
     * @returns this
     */
    onRef: (el: any) => void;
    /** 手動關閉窗口 */
    close: (...args: any[]) => void | Promise<void>;
    /**
     * 傳組件數據
     * @param {DefineProps<Name>} props 組件數據
     */
    props(props: DefineProps<Name>): ReturnPopupObject<Name, DefineProps<Name>>;
    /**
     * 設置彈窗配置
     * @param {PopupConfig} config 彈窗配置
     */
    config(config: PopupConfig): ReturnPopupObject<Name, Data>;
}
/** 列表渲染與關閉流程所需的寬化運行時句柄，避免展開所有彈窗組件類型 */
type RuntimePopupObject = {
    show: boolean;
    id: number;
    name: string;
    key: string;
    data: Record<string, any>;
    ref: any;
    disabled: boolean;
    closing: boolean;
    transitionConfig: TransitionProps;
    option: PopupConfig;
    event: Record<string, ((...args: any[]) => any)[]>;
    onRef: (el: any) => any;
    close: (...args: any[]) => void | Promise<void>;
};
export type ToastConfig = {
    /** 持續時間 */
    duration?: number;
};
/** toast */
declare class ToastObject {
    id: number;
    /** 显示文本 */
    text: string;
    /** 配置 */
    option: ToastConfig;
    timer: ReturnType<typeof setTimeout> | undefined;
    /** 窗口控制方法掛載 */
    private closeCtrlFn;
    constructor(id: number, text: string, option: (ToastConfig | number) | undefined, addCloseCtrlFn: (...args: any[]) => any);
    /** 手動關閉窗口 */
    close: () => void;
    /** 开始计时 */
    start(): void;
}
type PropsCache = {
    data: Record<string, unknown>;
    active: boolean;
};
type StoreCaches = {
    props?: PropsCache;
    config?: PopupConfig;
};
type PopupSingleConfig = Omit<PopupConfig, 'only'> & {
    only?: false;
};
declare class Store<Cache extends object = {}, Scoped extends boolean = false> {
    private readonly defaults;
    private readonly caches;
    private readonly propsToken?;
    get popupConfig(): ReadonlyConfig<PopupConfig>;
    popupIndex: import("vue").Ref<number, number>;
    popupList: RuntimePopupObject[];
    toastList: ToastObject[];
    constructor(popupConfig: PopupConfig, caches?: StoreCaches, propsToken?: PropsCache);
    createPopup<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>): ReturnPopupObject<Name, PopupCreateData<Name, Input, Scoped, Config>>;
    createPopup<const Name extends string>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>): ReturnPopupObject<Name, PopupReuseData<Name>>;
    private createPopupRuntime;
    open<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>): ReturnPopupObject<Name, PopupCreateData<Name, Input, Scoped, Config>>;
    open<const Name extends string>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>): ReturnPopupObject<Name, PopupReuseData<Name>>;
    only<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>): ReturnPopupObject<Name, PopupReuseData<Name>>;
    only<const Name extends string>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>): ReturnPopupObject<Name, PopupReuseData<Name>>;
    daily<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>): ReturnPopupObject<Name, PopupCreateData<Name, Input, Scoped, Config>>;
    daily<const Name extends string>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>): ReturnPopupObject<Name, PopupReuseData<Name>>;
    once<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>): ReturnPopupObject<Name, PopupCreateData<Name, Input, Scoped, Config>>;
    once<const Name extends string>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>): ReturnPopupObject<Name, PopupReuseData<Name>>;
    bottom<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>): ReturnPopupObject<Name, PopupCreateData<Name, Input, Scoped, Config>>;
    bottom<const Name extends string>(popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>, ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>): ReturnPopupObject<Name, PopupReuseData<Name>>;
    close(id?: number): RuntimePopupObject | null;
    toast(text: string, config?: ToastConfig | number): ToastObject;
    props<Props extends object>(props: Props): Store<Props, true>;
    config(config: PopupConfig): this;
}
/** 按默认配置取得 store，共享模块级弹窗状态。 */
declare function usePopupStore(popupConfig?: PopupConfig): Store<{}, false>;
export type PopupStore = ReturnType<typeof usePopupStore>;
export default usePopupStore;
