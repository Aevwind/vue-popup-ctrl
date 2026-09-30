import { reactive, shallowReactive, ref, nextTick } from 'vue';
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
  ComponentName,
  PopupData,
  PopupCacheCheck,
  PopupOpenArgs,
  PopupInput,
  PopupCreateData,
  PopupReuseData
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
type ReturnPopupObject<Name extends string = string, Data = PopupData<Name>> = Omit<
  PopupObject<Name, Data>,
  'show' | 'ref'
> & {
  show: boolean;
  ref: PopupInstance<Name> | undefined;
};

function deepMerge<T extends Record<string, any>, T1 extends Record<string, any>>(
  target: T = {} as T,
  source: T1,
  copies = new WeakMap<object, any>()
): T & T1 {
  const result = (isObject(target) ? target : {}) as any;
  if (isObject(source)) copies.set(source, result);

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)
      && key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
      const sourceValue = source[key];
      if (sourceValue === undefined) continue;
      const targetValue = Object.prototype.hasOwnProperty.call(result, key) ? result[key] : undefined;

      if (isObject(sourceValue)) {
        result[key] = copies.get(sourceValue)
          || deepMerge(isObject(targetValue) ? targetValue : {}, sourceValue, copies);
      } else if (Array.isArray(sourceValue)) {
        result[key] = copyConfigArray(sourceValue, copies);
      } else {
        // 非对象直接赋值
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

/** 配置数组也独立复制，避免默认配置、调用者与弹窗互相影响。 */
function copyConfigArray(source: any[], copies: WeakMap<object, any>): any[] {
  if (copies.has(source)) return copies.get(source);
  const result: any[] = [];
  copies.set(source, result);
  source.forEach((value, index) => {
    result[index] = Array.isArray(value)
      ? copyConfigArray(value, copies)
      : isObject(value) ? copies.get(value) || deepMerge({}, value, copies) : value;
  });
  return result;
}

function freezeConfig<T>(value: T, visited = new WeakSet<object>()): T {
  if ((isObject(value) || Array.isArray(value)) && !visited.has(value)) {
    visited.add(value);
    Object.values(value).forEach(item => freezeConfig(item, visited));
    Object.freeze(value);
  }
  return value;
}

type ReadonlyConfig<T, Depth extends unknown[] = []> = Depth['length'] extends 5 ? T
  : T extends object ? { readonly [K in keyof T]: ReadonlyConfig<T[K], [...Depth, unknown]> } : T;

/** props 仅合并顶层，保留嵌套数据的引用及其响应式行为。 */
function mergeProps(...sources: (Record<string, any> | null | undefined)[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(source)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      const value = source[key];
      if (value !== undefined) result[key] = value;
    }
  }
  return shallowReactive(result);
}

// 类型守卫函数
function isObject(value: any): value is Record<string, any> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** 创建弹窗对象 */
class PopupObject<Name extends string, Data = PopupData<Name>> {
  /** 簡單合併兩個對象 */
  static deepMerge = deepMerge;
  show = ref(false);
  /** 彈窗id */
  id: number;
  /** 弹窗名称 */
  name: ComponentName<Name>;
  /** 完整名称，用于区分 query 不同的弹窗。 */
  key: string;
  /** 弹窗数据 */
  data: Data;
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
  /** 同步 close 回调中再次调用句柄 close() 时直接关闭，避免递归。 */
  private closeEventDepth = 0;
  /** 窗口控制方法掛載 */
  private closeCtrlFn = (..._: any[]) => undefined;
  /** 事件列表 **/
  event: Record<string, ((...args: any[]) => any)[]> = Object.create(null);
  private listeners: Record<string, { active: boolean; source?: (...args: any[]) => any; handler: (...args: any[]) => any }[]> = Object.create(null);
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
    name: ComponentName<Name>,
    props: Data,
    option: PopupConfig,
    closeCtrlFn: (...args: any[]) => any,
    key: string = name
  ) {
    this.id = id;
    this.name = name;
    this.key = key;
    this.option = PopupObject.deepMerge(this.option, option || {});
    this.data = props; // 已浅合并的弹窗数据
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
    const record = { active: true, source, handler: (..._: any[]): any => undefined };
    const handler = (...args: any[]) => {
      if (!record.active) return;
      if (event === 'close') {
        this.closeEventDepth++;
        try {
          return listener(...args);
        } finally {
          this.closeEventDepth--;
        }
      }
      return listener(...args);
    };
    record.handler = handler;
    (this.event[event] ??= []).push(handler);
    (this.listeners[event] ??= []).push(record);
    return () => {
      // Vue 派发时遍历原数组；替换数组避免清理时跳过其它监听。
      record.active = false;
      this.event[event] = (this.event[event] || []).filter(item => item !== handler);
      this.listeners[event] = (this.listeners[event] || []).filter(record => record.handler !== handler);
    };
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
    > | undefined
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
  ): ReturnPopupObject<Name, Data>;
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
        let settled = false;
        const removeListeners: (() => void)[] = [];
        const close = this.closeCtrlFn.bind(this, this.id);
        const finish = (settle: () => void) => {
          if (settled) return;
          settled = true;
          removeListeners.forEach(remove => remove());
          settle();
        };
        if (this.disabled) {
          finish(() => resolve(undefined));
        } else if (event === 'close') {
          removeListeners.push(this.addListener(eventName, () => {
            finish(() => resolve(close));
          }));
        } else {
          removeListeners.push(this.addListener('close', () => {
            finish(() => reject(close));
          }));
          removeListeners.push(this.addListener(eventName, (...args) => {
            finish(() => resolve(args[0]));
          }));
        }
      });
    }
    if (event === 'close') {
      // 將窗口關閉方法作為參數傳入
      this.addListener(eventName, (...args: any[]) => {
        return (callback as any).call(this, this.closeCtrlFn.bind(this, this.id), ...args);
      }, callback as (...args: any[]) => any);
    } else {
      if (!this.disabled) {
        this.addListener(eventName, callback as (...args: any[]) => any, callback as (...args: any[]) => any);
      }
    }
    return this as unknown as ReturnPopupObject<Name, Data>;
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
  ): ReturnPopupObject<Name, Data> {
    if (typeof func !== 'function') return this as unknown as ReturnPopupObject<Name, Data>;
    const records = this.listeners[event as string];
    const index = records?.findIndex(record => record.source === func) ?? -1;
    if (index > -1) {
      const record = records[index];
      record.active = false;
      this.listeners[event as string] = records.filter(item => item !== record);
      this.event[event as string] = (this.event[event as string] || []).filter(item => item !== record.handler);
    }
    return this as unknown as ReturnPopupObject<Name, Data>;
  }
  /**
   * 獲取組件實例
   * @param el 組件
   * @returns this
   */
  onRef = (el: any) => {
    this.ref.value = el ?? undefined;
  };
  /** 手動關閉窗口 */
  close = (...args: any[]): void | Promise<void> => {
    /** 在close方法內調用處理 */
    if (this.closeEventDepth > 0) {
      this.closeCtrlFn.call(this, this.id, ...args);
    } else {
      const pending: Promise<unknown>[] = [];
      for (const fn of this.event['close']?.slice() || []) {
        try {
          const result = fn.call(this, ...args);
          if (result != null && typeof result.then === 'function') {
            pending.push(Promise.resolve(result));
          }
        } catch (error) {
          if (!pending.length) throw error;
          // 已启动的异步监听也必须接入错误处理，避免同步异常遗留拒绝。
          pending.push(Promise.reject(error));
          break;
        }
      }
      if (pending.length) return Promise.all(pending).then(() => undefined);
    }
  };
  /**
   * 傳組件數據
   * @param {DefineProps<Name>} props 組件數據
   */
  props(props: DefineProps<Name>): ReturnPopupObject<Name, DefineProps<Name>> {
    this.data = shallowReactive(props) as Data;
    return this as unknown as ReturnPopupObject<Name, DefineProps<Name>>;
  }
  /**
   * 設置彈窗配置
   * @param {PopupConfig} config 彈窗配置
   */
  config(config: PopupConfig): ReturnPopupObject<Name, Data> {
    this.option = PopupObject.deepMerge(this.option, config || {});
    this.initTransitionConfig();
    return this as unknown as ReturnPopupObject<Name, Data>;
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
  close: (...args: any[]) => void | Promise<void>;
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

const popupList: RuntimePopupObject[] = reactive([]);
const toastList: Array<ToastObject> = reactive([]);
const popupIndex = ref(1);

type PropsCache = { data: Record<string, unknown>; active: boolean };
type StoreCaches = { props?: PropsCache; config?: PopupConfig };
type PopupSingleConfig = Omit<PopupConfig, 'only'> & { only?: false };

// 缓存视图绑定创建时的令牌，避免其它链覆盖后读到类型不同的数据。
class Store<Cache extends object = {}, Scoped extends boolean = false> {
  private readonly defaults: PopupConfig;
  private readonly caches: StoreCaches;
  private readonly propsToken?: PropsCache;
  get popupConfig(): ReadonlyConfig<PopupConfig> { return this.defaults; }
  popupIndex = popupIndex;
  popupList = popupList;
  toastList = toastList;
  constructor(popupConfig: PopupConfig, caches: StoreCaches = {}, propsToken?: PropsCache) {
    this.defaults = freezeConfig(PopupObject.deepMerge({}, popupConfig));
    this.caches = caches;
    this.propsToken = propsToken;
  }
  createPopup<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>
  ): ReturnPopupObject<Name, PopupCreateData<Name, Input, Scoped, Config>>;
  createPopup<const Name extends string>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>
  ): ReturnPopupObject<Name, PopupReuseData<Name>>;
  createPopup(popupName: string, popupData?: Record<string, any>, popupConfig: PopupConfig = {}): ReturnPopupObject<string> {
    return this.createPopupRuntime(popupName, popupData, popupConfig);
  }
  private createPopupRuntime(
    popupName: string,
    popupData?: Record<string, any>,
    popupConfig: PopupConfig = {}
  ): ReturnPopupObject<string> {
    let configClone = PopupObject.deepMerge({}, this.defaults);
    if (this.caches.config) {
      configClone = PopupObject.deepMerge(configClone, this.caches.config);
      delete this.caches.config;
    }
    const token = this.propsToken ?? this.caches.props;
    const cachedProps = token?.active ? token.data : undefined;
    if (token) {
      token.active = false;
      if (this.caches.props === token) delete this.caches.props;
    }
    popupConfig = PopupObject.deepMerge(configClone, popupConfig);
    // if (!popupName) return '';
    const popupId = this.popupIndex.value++;
    const query: Record<string, string | true> = {};
    let name: string = popupName;
    // 彈窗名後面拼參數
    if (name.indexOf('?') > -1) {
      let search = '';
      [name, search] = String(popupName).split('?');
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
        return popup as ReturnPopupObject<string>;
      }
    }
    // 創建窗口對象
    const rawPopupObject = new PopupObject<string>(
      popupId,
      name,
      mergeProps(cachedProps, popupData, query),
      popupConfig,
      this.close.bind(this),
      popupName
    );
    const popupObject = reactive(
      rawPopupObject as unknown as RuntimePopupObject
    ) as unknown as ReturnPopupObject<string>;
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
  open<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>
  ): ReturnPopupObject<Name, PopupCreateData<Name, Input, Scoped, Config>>;
  open<const Name extends string>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>
  ): ReturnPopupObject<Name, PopupReuseData<Name>>;
  open(popupName: string, popupData?: Record<string, any>, popupConfig: PopupConfig = {}): ReturnPopupObject<string> {
    return this.createPopupRuntime(popupName, popupData, popupConfig);
  }
  only<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>
  ): ReturnPopupObject<Name, PopupReuseData<Name>>;
  only<const Name extends string>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>
  ): ReturnPopupObject<Name, PopupReuseData<Name>>;
  only(popupName: string, popupData?: Record<string, any>, popupConfig: PopupConfig = {}): ReturnPopupObject<string> {
    return this.createPopupRuntime(
      popupName,
      popupData,
      PopupObject.deepMerge(PopupObject.deepMerge({}, popupConfig), { only: true })
    );
  }
  daily<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>
  ): ReturnPopupObject<Name, PopupCreateData<Name, Input, Scoped, Config>>;
  daily<const Name extends string>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>
  ): ReturnPopupObject<Name, PopupReuseData<Name>>;
  daily(popupName: string, popupData?: Record<string, any>, popupConfig: PopupConfig = {}): ReturnPopupObject<string> {
    return this.createPopupRuntime(
      popupName,
      popupData,
      PopupObject.deepMerge(PopupObject.deepMerge({}, popupConfig), { type: 'daily' })
    );
  }
  once<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>
  ): ReturnPopupObject<Name, PopupCreateData<Name, Input, Scoped, Config>>;
  once<const Name extends string>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>
  ): ReturnPopupObject<Name, PopupReuseData<Name>>;
  once(popupName: string, popupData?: Record<string, any>, popupConfig: PopupConfig = {}): ReturnPopupObject<string> {
    return this.createPopupRuntime(
      popupName,
      popupData,
      PopupObject.deepMerge(PopupObject.deepMerge({}, popupConfig), { type: 'once' })
    );
  }
  bottom<const Name extends string, Input extends object | undefined = undefined, const Config extends PopupConfig = PopupSingleConfig>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, NoInfer<Input>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, Input, Config>
  ): ReturnPopupObject<Name, PopupCreateData<Name, Input, Scoped, Config>>;
  bottom<const Name extends string>(
    popupName: Name & PopupCacheCheck<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>>,
    ...args: PopupOpenArgs<NoInfer<Name>, Cache, PopupInput<NoInfer<Name>, Cache>, PopupConfig>
  ): ReturnPopupObject<Name, PopupReuseData<Name>>;
  bottom(popupName: string, popupData?: Record<string, any>, popupConfig: PopupConfig = {}): ReturnPopupObject<string> {
    return this.createPopupRuntime(
      popupName,
      popupData,
      PopupObject.deepMerge(PopupObject.deepMerge({}, popupConfig), { anime: 'bottom' })
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
  props<Props extends object>(props: Props): Store<Props, true> {
    if (this.caches.props) this.caches.props.active = false;
    const token: PropsCache = { data: mergeProps(props), active: true };
    this.caches.props = token;
    return new Store<Props, true>(this.defaults, this.caches, token);
  }
  config(config: PopupConfig): this {
    this.caches.config = config;
    return this;
  }
}

const popupStoreCache: Record<string, Store> = Object.create(null);

/** 按默认配置取得 store，共享模块级弹窗状态。 */
function usePopupStore(popupConfig: PopupConfig = {}) {
  const snapshot = PopupObject.deepMerge({}, popupConfig);
  const key = JSON.stringify(snapshot);
  if (popupStoreCache[key]) {
    return popupStoreCache[key];
  } else {
    popupStoreCache[key] = new Store(snapshot);
    return popupStoreCache[key];
  }
}

export type PopupStore = ReturnType<typeof usePopupStore>;
export default usePopupStore;
