import { reactive, ref, nextTick } from 'vue';
import type {
  // ComputedOptions,
  // MethodOptions,
  // EmitsOptions,
  // PropType,
  StyleValue,
  TransitionProps
} from 'vue';
import type {
  DefineEmits,
  DefineProps,
  PopupInstance,
  PopupCompsKey
} from './popup.types.js';
import { readStorage, writeStorage, storageNamespace } from './storage.js';

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
      origin: { y: number };
      /**
       * 礼花层级
       */
      zIndex: number;
    }
  ];
}

/** 所有彈窗組件 */
// type PopupComponent = PopupComponent
/** 所有彈窗组件名稱 */
// type PopupCompsKey = keyof PopupComponent;

/** 获取vue组件参数 */
// type ComponentParams<Name extends string> = Name extends PopupCompsKey
//   ? PopupComps[Name] extends DefineComponent<
//       infer P,
//       infer B,
//       infer D,
//       infer C extends ComputedOptions,
//       infer M extends MethodOptions,
//       infer Mixin,
//       infer Extends,
//       infer E extends EmitsOptions,
//       infer PublicProps,
//       infer Defaults
//     >
//     ? {
//         P: P;
//         B: B;
//         D: D;
//         C: C;
//         M: M;
//         Mixin: Mixin;
//         Extends: Extends;
//         E: E;
//         PublicProps: PublicProps;
//         Defaults: Defaults;
//       }
//     : never
//   : never;

/** 解析字符串参数 */
type SplitParams<Str extends string> = Str extends `${infer Name}?${infer Params}`
  ? [Name, FormatParams<Params>]
  : [Str, any];
type FormatParams<Str extends string> = Str extends `${infer Param1}&${infer Param2}`
  ? ForamtValue<Param1> & FormatParams<Param2>
  : ForamtValue<Str>;
type ForamtValue<Str extends string> = Str extends `${infer Name}=${infer Value}`
  ? { [T in Name]: Value }
  : { [T in Str]: true };
/** 获取组件名字 */
type FormatName<Name extends string> = SplitParams<Name>[0];

/** 获取参数 */
type GetObjectParams<T, K, D = never> = K extends keyof T ? Pick<T, K>[K] : D;
type GetFunctionParams<T, K = never, D = never> = T extends (...args: any[]) => any
  ? K extends number
    ? Parameters<T>[K]
    : Parameters<T>
  : D;

/** 获取组件props */
// type Props<Name extends string> = SplitParams<Name>[0] extends PopupCompsKey
//   ? `$props` extends keyof ComponentParams<SplitParams<Name>[0]>['B']
//     ? {
//         -readonly [T in keyof GetObjectParams<
//           ComponentParams<SplitParams<Name>[0]>['B'],
//           '$props'
//         >]?: GetObjectParams<ComponentParams<SplitParams<Name>[0]>['B'], T>;
//       }
//     : {
//         [T in keyof ComponentParams<SplitParams<Name>[0]>['P']]?: GetObjectParams<
//           ComponentParams<SplitParams<Name>[0]>['P'][T],
//           'type'
//         > extends PropType<infer Type>
//           ? Type
//           : GetObjectParams<ComponentParams<SplitParams<Name>[0]>['P'][T], 'default'>;
//       }
//   : Record<string, any>;

/** 关闭窗口emit事件 */
type DefaultEmitEvent = {
  close: (cb: () => void, ...args: any[]) => void;
};
/** 获取组件emit */
// type Emits<Name extends string> = SplitParams<Name>[0] extends PopupCompsKey
//   ? `$emit` extends keyof ComponentParams<SplitParams<Name>[0]>['B']
//     ? {
//         [K in GetFunctionParams<
//           ComponentParams<SplitParams<Name>[1]>['B']['$emit'],
//           0
//         >]: GetObjectParams<ComponentParams<SplitParams<Name>[0]>['B'], '$emit', never>;
//       }
//     : {
//         [K in keyof ComponentParams<SplitParams<Name>[0]>['E']]: ComponentParams<
//           SplitParams<Name>[0]
//         >['E'][K];
//       }
//   : never;

/** 對外統一返回的響應式彈窗句柄 */
type ReturnPopupObject<Name extends string = string> = Omit<
  PopupObject<Name>,
  'show' | 'ref'
> & {
  show: boolean;
  ref: PopupInstance<Name> | undefined;
};

function deepMerge<T extends Record<string, any>, T1 extends Record<string, any>>(
  target: T = {} as T,
  source: T1
): T & T1 {
  const result = (isObject(target) ? target : {}) as any;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)
      && key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
      const sourceValue = source[key];
      if (sourceValue === undefined) continue;
      const targetValue = Object.prototype.hasOwnProperty.call(result, key) ? result[key] : undefined;

      if (isObject(sourceValue)) {
        // 如果目标值不是对象，则初始化为空对象
        // 递归合并
        result[key] = deepMerge(isObject(targetValue) ? targetValue : {}, sourceValue);
      } else {
        // 非对象直接赋值
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

// 类型守卫函数
function isObject(value: any): value is Record<string, any> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** 创建弹窗对象 */
class PopupObject<Name extends string> {
  /** 簡單合併兩個對象 */
  static deepMerge = deepMerge;
  show = ref(false);
  /** 彈窗id */
  id: number;
  /** 弹窗名称 */
  name: Name;
  /** 完整名称，用于区分 query 不同的弹窗。 */
  key: string;
  /** 弹窗数据 */
  data: DefineProps<Name>;
  /** 彈窗組件 */
  ref = ref<PopupInstance<Name>>();
  /** disabled */
  disabled = false;
  /** 是否正在關閉 */
  closing = false;
  transitionConfig: TransitionProps = {};
  /** 配置 */
  option: PopupConfig = {
    type: '',
    maskClose: undefined, // 點擊遮罩關閉
    maskColor: undefined, // 點擊遮罩關閉
    only: false, // 只能存在一個
    opacity: undefined, // 透明度
    zIndex: undefined, // 層級
    anime: 'bounce', // 動畫
    maskStyle: {},
    confettiConf: [
      {
        particleCount: 60, // 礼花数量
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999
      }
    ]
  };
  /** close 回调中再次调用句柄 close() 时直接关闭，避免递归。 */
  private closeEventDepth = 0;
  /** 窗口控制方法掛載 */
  private closeCtrlFn = (..._: any[]) => undefined;
  /** 事件列表 **/
  event: Record<string, ((...args: any[]) => any)[]> = Object.create(null);
  private listeners: Record<string, { source?: (...args: any[]) => any; handler: (...args: any[]) => any }[]> = Object.create(null);
  /**
   *
   * @param id 彈窗id
   * @param name 彈窗組件名
   * @param data 彈窗props數據
   * @param option 彈窗配置
   * @param closeCtrlFn 關閉控制方法
   */
  constructor(
    id: number,
    name: Name,
    props: DefineProps<Name>,
    option: PopupConfig,
    closeCtrlFn: (...args: any[]) => any,
    key: string = name
  ) {
    this.id = id;
    this.name = name;
    this.key = key;
    this.option = PopupObject.deepMerge(this.option, option || {});
    this.data = props; // 弹窗数据
    this.initTransitionConfig();
    this.closeCtrlFn = closeCtrlFn;
  }
  /** 初始化彈窗動畫參數 */
  initTransitionConfig() {
    const name = this.option.anime;
    const duration: TransitionProps['duration'] = {
      enter: 300,
      leave: 300
    };
    if (name === 'boom') {
      duration.enter = 850;
    } else if (name === 'none') {
      duration.enter = 0;
      duration.leave = 0;
    }

    this.transitionConfig = {
      name,
      duration
    };
  }
  private addListener(event: string, listener: (...args: any[]) => any, source?: (...args: any[]) => any) {
    const handler = event === 'close' ? (...args: any[]) => {
      this.closeEventDepth++;
      try {
        return listener(...args);
      } finally {
        this.closeEventDepth--;
      }
    } : listener;
    (this.event[event] ??= []).push(handler);
    (this.listeners[event] ??= []).push({ source, handler });
  }
  /**
   * 註冊監聽$emit事件, 返回promise,主要方便用于try catch的方式使用
   * @param event 事件名
   * @returns { Promise } 彈窗對象
   */
  on<EventType extends string>(
    event: keyof DefaultEmitEvent | keyof DefineEmits<Name> | EventType
  ): Promise<
    GetFunctionParams<
      GetObjectParams<
        DefaultEmitEvent,
        EventType,
        GetObjectParams<DefineEmits<Name>, EventType, (...args: any[]) => any>
      >,
      0
    >
  >;
  /**
   * 註冊監聽$emit事件, 觸發在組件上使用$emit('事件名')觸發事件
   * @param event 事件名
   * @param callback 事件回調
   * @returns { PopupObject } 彈窗對象
   */
  on<EventType extends string>(
    event: keyof DefaultEmitEvent | keyof DefineEmits<Name> | EventType,
    callback: GetObjectParams<
      DefaultEmitEvent,
      EventType,
      GetObjectParams<DefineEmits<Name>, EventType, (...args: any[]) => void>
    >
  ): ReturnPopupObject<Name>;
  on<EventType extends string>(
    event: keyof DefaultEmitEvent | keyof DefineEmits<Name> | EventType,
    callback?: GetObjectParams<
      DefaultEmitEvent,
      EventType,
      GetObjectParams<DefineEmits<Name>, EventType, (...args: any[]) => void>
    >
  ) {
    const eventName = event as string;
    // 沒有傳入回調返回promise
    if (typeof callback !== 'function') {
      return new Promise((resolve, reject) => {
        if (event === 'close') {
          this.addListener(eventName, () => {
            resolve(this.closeCtrlFn.bind(this, this.id));
          });
        } else {
          let fulfilled = false;
          this.addListener('close', () => {
            if (fulfilled) {
              this.closeCtrlFn.call(this, this.id);
            } else {
              fulfilled = true;
              reject(this.closeCtrlFn.bind(this, this.id));
            }
          });
          this.addListener(eventName, (...args) => {
            fulfilled = true;
            resolve(args[0]);
          });
          if (this.disabled) {
            fulfilled = true;
            resolve(undefined);
          }
        }
      });
    }
    if (event === 'close') {
      // 將窗口關閉方法作為參數傳入
      this.addListener(eventName, (...args: any[]) => {
        (callback as any).call(this, this.closeCtrlFn.bind(this, this.id), ...args);
      }, callback as (...args: any[]) => any);
    } else {
      this.addListener(eventName, callback as (...args: any[]) => any, callback as (...args: any[]) => any);
      if (this.disabled) {
        callback?.();
      }
    }
    return this as unknown as ReturnPopupObject<Name>;
  }
  /**
   * 解綁監聽$emit事件
   * @param event 事件名
   * @param callback 註冊事件時使用的函數
   * @returns { PopupObject } 彈窗對象
   */
  un<EventType extends string>(
    event: keyof DefaultEmitEvent | keyof DefineEmits<Name> | EventType,
    func: any
  ): ReturnPopupObject<Name> {
    if (typeof func !== 'function') return this as unknown as ReturnPopupObject<Name>;
    const records = this.listeners[event as string];
    const index = records?.findIndex(record => record.source === func) ?? -1;
    if (index > -1) {
      const [record] = records.splice(index, 1);
      const handlerIndex = this.event[event as string]?.indexOf(record.handler) ?? -1;
      if (handlerIndex > -1) this.event[event as string].splice(handlerIndex, 1);
    }
    return this as unknown as ReturnPopupObject<Name>;
  }
  /**
   * 獲取組件實例
   * @param el 組件
   * @returns this
   */
  onRef = (el: any) => {
    this.ref.value = el;
  };
  /** 手動關閉窗口 */
  close = (...args: any[]) => {
    /** 在close方法內調用處理 */
    if (this.closeEventDepth > 0) {
      this.closeCtrlFn.call(this, this.id, ...args);
    } else {
      this.event['close']?.slice().forEach(fn => {
        fn.call(this, ...args);
      });
    }
  };
  /**
   * 傳組件數據
   * @param {DefineProps<Name>} props 組件數據
   */
  props(props: DefineProps<Name>): ReturnPopupObject<Name> {
    this.data = props; // 弹窗数据
    return this as unknown as ReturnPopupObject<Name>;
  }
  /**
   * 設置彈窗配置
   * @param {PopupConfig} config 彈窗配置
   */
  config(config: PopupConfig): ReturnPopupObject<Name> {
    this.option = PopupObject.deepMerge(this.option, config || {});
    this.initTransitionConfig();
    return this as unknown as ReturnPopupObject<Name>;
  }
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
  close: (...args: any[]) => void;
};

export type ToastConfig = {
  /** 持續時間 */
  duration?: number;
};
/** toast */
class ToastObject {
  id: number;
  /** 显示文本 */
  text = '';
  /** 配置 */
  option: ToastConfig = {
    /** 持續時間 */
    duration: 3000
  };
  timer: ReturnType<typeof setTimeout> | undefined;
  /** 窗口控制方法掛載 */
  private closeCtrlFn = (..._: any[]) => undefined;
  constructor(
    id: number,
    text: string,
    option: ToastConfig | number = {},
    addCloseCtrlFn: (...args: any[]) => any
  ) {
    this.id = id;
    this.text = text;
    this.closeCtrlFn = addCloseCtrlFn;
    // 只傳入數字則為持續時間
    if (typeof option === 'number') {
      this.option = PopupObject.deepMerge(this.option, { duration: option });
    } else {
      this.option = PopupObject.deepMerge(this.option, option || {});
    }
  }
  /** 手動關閉窗口 */
  close = () => {
    clearTimeout(this.timer || 0);
    this.closeCtrlFn(this.id);
  };
  /** 开始计时 */
  start() {
    // 固定時長後自動關閉
    this.timer = setTimeout(() => {
      this.close();
    }, this.option.duration);
  }
}

function createPopupStore() {

  const popupList: RuntimePopupObject[] = reactive([]);
  const toastList: Array<ToastObject> = reactive([]);
  const popupIndex = ref(1);
  // 當前正在關閉的彈窗id

  class Store {
    popupConfig = {};
    popupIndex = popupIndex;
    popupList = popupList;
    toastList = toastList;
    /** 緩存數據 */
    dataCache: any = null;
    /** 緩存配置 */
    configCache: any = null;
    constructor(popupConfig: PopupConfig) {
      this.popupConfig = popupConfig;
    }
    createPopup<Name extends string>(
      popupName: Name | PopupCompsKey,
      popupData?: DefineProps<Name>,
      popupConfig: PopupConfig = {}
    ): ReturnPopupObject<FormatName<Name>> {
      let configClone = PopupObject.deepMerge({}, this.popupConfig);
      if (this.configCache) {
        configClone = PopupObject.deepMerge(configClone, this.configCache);
        this.configCache = null;
      }
      if (this.dataCache) {
        popupData = PopupObject.deepMerge(this.dataCache, popupData || {});
        this.dataCache = null;
      }
      popupConfig = PopupObject.deepMerge(configClone, popupConfig);
      // if (!popupName) return '';
      const popupId = this.popupIndex.value++;
      const query: SplitParams<typeof popupName>[1] = {};
      let name: SplitParams<typeof popupName>[0] = popupName as SplitParams<typeof popupName>[0];
      // 彈窗名後面拼參數
      if (name.indexOf('?') > -1) {
        let search = '';
        [name as any, search as any] = String(popupName).split('?');
        search.split('&').forEach(item => {
          const [key = '', value] = item.split('=');
          query[key] = value || true;
        });
      }
      // 配置了只能存在一個同名彈窗
      if (popupConfig?.only) {
        const [popup] = this.popupList.filter(
          popup => popup.key === popupName && !popup.closing
        );
        if (popup) {
          return popup as ReturnPopupObject<FormatName<Name>>;
        }
      }
      // 創建窗口對象
      const rawPopupObject = new PopupObject(
        popupId,
        name as FormatName<Name>,
        PopupObject.deepMerge(PopupObject.deepMerge({}, popupData || {}), query) as DefineProps<FormatName<Name>>,
        popupConfig,
        this.close.bind(this),
        popupName
      );
      const popupObject = reactive(
        rawPopupObject as unknown as RuntimePopupObject
      ) as unknown as ReturnPopupObject<FormatName<Name>>;
      /** 彈窗類型处理关闭事件 */
      if (popupConfig.type === 'daily') {
        const storeName = `${storageNamespace()}_${popupName}_daily_open_time`;
        const prevDayTime = readStorage(storeName) || 0;
        const curDayTime = new Date().setHours(0, 0, 0, 0);
        popupObject.disabled = curDayTime <= Number(prevDayTime);
        popupObject.on('close', (_, val) => {
          if (val) {
            writeStorage(storeName, null);
          } else {
            writeStorage(storeName, curDayTime.toString());
          }
          /** 沒有其它關閉事件才觸發 */
          if (popupObject.event.close?.length === 1) {
            this.close(popupObject.id);
          }
        });
      } else if (popupConfig.type === 'once') {
        const storeName = `${storageNamespace()}_${popupName}_once`;
        const storeVal = readStorage(storeName);
        popupObject.disabled = Boolean(Number(storeVal));
        popupObject.on('close', (_, val) => {
          if (val) {
            writeStorage(storeName, null);
          } else {
            writeStorage(storeName, '1');
          }
          /** 沒有其它關閉事件才觸發 */
          if (popupObject.event.close?.length === 1) {
            this.close(popupObject.id);
          }
        });
      } else {
        // 默認關閉窗口事件
        popupObject.on('close', () => {
          /** 沒有其它關閉事件才觸發 */
          if (popupObject.event.close?.length === 1) {
            this.close(popupObject.id);
          }
        });
      }

      if (!popupObject.disabled) {
        this.popupList.push(popupObject as unknown as RuntimePopupObject);
        nextTick(() => {
          if (!popupObject.closing) {
            popupObject.show = true;
          }
        });
      }
      return popupObject;
    }
    open<Name extends string>(
      popupName: Name | PopupCompsKey,
      popupData?: DefineProps<Name>,
      popupConfig: PopupConfig = {}
    ): ReturnPopupObject<FormatName<Name>> {
      return this.createPopup(popupName, popupData, popupConfig);
    }
    only<Name extends string>(
      popupName: Name | PopupCompsKey,
      popupData?: DefineProps<Name>,
      popupConfig: PopupConfig = {}
    ): ReturnPopupObject<FormatName<Name>> {
      return this.createPopup(
        popupName,
        popupData,
        PopupObject.deepMerge(popupConfig, { only: true })
      );
    }
    daily<Name extends string>(
      popupName: Name | PopupCompsKey,
      popupData?: DefineProps<Name>,
      popupConfig: PopupConfig = {}
    ): ReturnPopupObject<FormatName<Name>> {
      return this.createPopup(
        popupName,
        popupData,
        PopupObject.deepMerge(popupConfig, { type: 'daily' })
      );
    }
    once<Name extends string>(
      popupName: Name | PopupCompsKey,
      popupData?: DefineProps<Name>,
      popupConfig: PopupConfig = {}
    ): ReturnPopupObject<FormatName<Name>> {
      return this.createPopup(
        popupName,
        popupData,
        PopupObject.deepMerge(popupConfig, { type: 'once' })
      );
    }
    bottom<Name extends string>(
      popupName: Name | PopupCompsKey,
      popupData?: DefineProps<Name>,
      popupConfig: PopupConfig = {}
    ): ReturnPopupObject<FormatName<Name>> {
      return this.createPopup(
        popupName,
        popupData,
        Object.assign(popupConfig, { anime: 'bottom' })
      );
    }
    close(id = -1): RuntimePopupObject | null {
      let popup: RuntimePopupObject | null = null;
      // 沒有傳id關閉最後一個
      if (id === -1) {
        for (let i = this.popupList.length - 1; i >= 0; i--) {
          const item = this.popupList[i];
          if (item && !item.closing) {
            popup = item;
            break;
          }
        }
      } else {
        popup = this.popupList.find(item => item.id === id) || null;
      }
      if (popup && !popup.closing) {
        const popupId = popup.id;
        popup.closing = true;
        popup.show = false;
        nextTick(() => {
          const index = this.popupList.findIndex(item => item.id === popupId);
          if (index > -1) this.popupList.splice(index, 1);
        });
      }
      return popup;
    }
    toast(text: string, config?: ToastConfig | number): ToastObject {
      const toastId = this.popupIndex.value++;
      const toastObject = new ToastObject(toastId, text, config, () => {
        const index = this.toastList.findIndex(toastObj => toastObj.id === toastId);
        if (index > -1) {
          return this.toastList.splice(index, 1);
        }
        return false;
      });
      this.toastList.push(toastObject);
      toastObject.start();
      return toastObject;
    }
    props(props: Record<string, any>) {
      this.dataCache = props; // 弹窗数据
      return this;
    }
    config(config: PopupConfig) {
      this.configCache = config;
      return this;
    }
  }

  const popupStoreCache: Record<string, Store> = Object.create(null);

  function usePopupStore(popupConfig: PopupConfig = {}) {
    const key = JSON.stringify(popupConfig);
    if (popupStoreCache[key]) {
      return popupStoreCache[key];
    } else {
      popupStoreCache[key] = new Store(popupConfig);
      return popupStoreCache[key];
    }
  }

  /**
   * popupStore
   * @params config store默認彈窗配置
   */
  return usePopupStore;
}

const usePopupStore = createPopupStore();
export type PopupStore = ReturnType<typeof usePopupStore>;
export default usePopupStore;
