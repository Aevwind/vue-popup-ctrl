import type { ComponentPublicInstance, GlobalComponents, PublicProps } from 'vue';

type CapitalizedKeys<T, Prefix extends string> = {
  [K in keyof T]: K extends `${Prefix}${infer S}`
    ? S extends Capitalize<S> ? K : never
    : never;
}[keyof T];

type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type ComponentName<Name extends string> = Name extends `${infer Base}?${string}` ? Base : Name;

type MergeProps<Left, Right> = Prettify<Omit<Left, keyof Right> & Right>;
type QueryValue<Value extends string> = Value extends `${infer First}=${string}`
  ? First extends '' ? true : First
  : Value extends '' ? true : Value;
type QueryProperty<Key extends string, Value> = Key extends '__proto__' | 'constructor' | 'prototype'
  ? {}
  : { [K in Key]: Value };
type QueryEntry<Entry extends string> = Entry extends `${infer Key}=${infer Value}`
  ? QueryProperty<Key, QueryValue<Value>>
  : QueryProperty<Entry, true>;
type ParseQuery<Query extends string> = Query extends `${infer Head}&${infer Tail}`
  ? MergeProps<QueryEntry<Head>, ParseQuery<Tail>>
  : QueryEntry<Query>;
type QueryText<Query extends string> = Query extends `${infer First}?${string}` ? First : Query;
type IsDynamicQueryPart<Part extends string> = string extends Part
  ? true
  : Part extends `${infer Value extends number}`
    ? number extends Value ? true : false
    : Part extends `${infer Value extends bigint}`
      ? bigint extends Value ? true : false
      : false;
type IsQueryLiteral<Query extends string, Depth extends unknown[] = [], Segments extends unknown[] = []> = string extends Query
  ? false
  : Query extends ''
    ? true
    : Depth['length'] extends 128
      ? false
      : Segments['length'] extends 20
        ? false
        : Query extends `${infer Head}${infer Tail}`
          ? IsDynamicQueryPart<Head> extends true
            ? false
            : IsQueryLiteral<Tail, [...Depth, unknown], Head extends '&' ? [...Segments, unknown] : Segments>
          : false;
type QueryData<Props, Query extends string> = IsQueryLiteral<Query> extends true
  ? MergeProps<Props, ParseQuery<Query>>
  : Prettify<{ [K in keyof Props]: Props[K] | string | true }> & Record<string, unknown>;

/** 用户注册的 Popup 开头组件；控制容器本身不是业务弹窗。 */
export type PopupComps = Pick<GlobalComponents, Exclude<CapitalizedKeys<GlobalComponents, 'Popup'>, 'PopupCtrl'>>;
export type PopupCompsKey = Extract<keyof PopupComps, string>;

export type PopupInstance<Name extends string> = ComponentName<Name> extends keyof PopupComps
  ? PopupComps[ComponentName<Name>] extends abstract new (...args: any[]) => infer Instance
    ? Instance
    : ComponentPublicInstance
  : ComponentPublicInstance;

type ComponentProps<Name extends string> = PopupInstance<Name> extends { $props: infer Props }
  ? Props
  : Record<string, any>;

export type DefineProps<Name extends string> = ComponentName<Name> extends PopupCompsKey
  ? Prettify<Omit<ComponentProps<Name>, keyof PublicProps | CapitalizedKeys<ComponentProps<Name>, 'on'>>>
  : Record<string, any>;

/** 字面量 query 精确覆盖；动态 query 可能为空或包含其它参数，使用保守的数据类型。 */
export type PopupData<Name extends string> = Name extends `${string}?${infer Query}`
  ? QueryData<DefineProps<Name>, QueryText<Query>>
  : DefineProps<Name>;

type RequiredKeys<Props> = {
  [K in keyof Props]-?: {} extends Pick<Props, K> ? never : K;
}[keyof Props];

type DefinedKeys<Props> = [Props] extends [object] ? {
  [K in RequiredKeys<Props>]-?: undefined extends Props[K] ? never : K;
}[RequiredKeys<Props>] : never;

type CachedKeys<Name extends string, Cache> = Extract<DefinedKeys<Cache>, keyof DefineProps<Name>>;

/** 缓存只能补充已知且非 undefined 的属性；显式 undefined 不会覆盖缓存。 */
export type PopupInput<Name extends string, Cache> = Prettify<
  Omit<DefineProps<Name>, CachedKeys<Name, Cache>>
  & Partial<Pick<DefineProps<Name>, CachedKeys<Name, Cache>>>
>;

type InvalidCachedKeys<Name extends string, Cache, Input> = Cache extends unknown ? {
  [K in Extract<keyof DefineProps<Name>, keyof Cache>]-?:
    K extends DefinedKeys<Input> ? never
      : Exclude<Cache[K], undefined> extends DefineProps<Name>[K] ? never : K;
}[Extract<keyof DefineProps<Name>, keyof Cache>] : never;

/** 在选择组件时校验之前缓存的数据，避免泛型链式调用丢失 props 检查。 */
export type PopupCacheCheck<Name extends string, Cache, Input> =
  [InvalidCachedKeys<Name, Cache, Input>] extends [never] ? unknown : never;

/** 必填属性只能由本次参数或已知缓存补齐，配置始终是第三个参数。 */
export type PopupOpenArgs<Name extends string, Cache, Input, Config> =
  {} extends PopupInput<Name, Cache>
    ? [popupData?: Input & PopupInput<Name, Cache>, popupConfig?: Config]
    : [popupData: Input & PopupInput<Name, Cache>, popupConfig?: Config];

type InputData<Name extends string, Input, Scoped extends boolean> = Prettify<{
  [K in keyof DefineProps<Name>]: K extends DefinedKeys<Input> ? DefineProps<Name>[K]
    : Scoped extends true
      ? K extends RequiredKeys<DefineProps<Name>> ? DefineProps<Name>[K] | undefined : DefineProps<Name>[K]
      : unknown;
}>;

/** 根 Store 可被其它别名写入缓存；缓存视图仅消费自身缓存，且可被复用。 */
export type PopupOpenData<Name extends string, Input, Scoped extends boolean = false> = Name extends `${string}?${infer Query}`
  ? QueryData<InputData<Name, Input, Scoped>, QueryText<Query>>
  : InputData<Name, Input, Scoped>;

/** 复用弹窗的数据可能已被 props() 替换，包括原 query 字段；保留字段布局以便访问守卫。 */
export type PopupReuseData<Name extends string> = { [K in keyof PopupData<Name>]: unknown };

type MayReuse<Config> = Config extends unknown
  ? 'only' extends keyof Config ? true extends Config['only'] ? true : false : false
  : never;

/** 显式配置可能启用 only 时，无法保证返回数据来自本次创建参数。 */
export type PopupCreateData<Name extends string, Input, Scoped extends boolean, Config> =
  true extends MayReuse<Config> ? PopupReuseData<Name> : PopupOpenData<Name, Input, Scoped>;

export type DefineEmits<Name extends string> = ComponentName<Name> extends PopupCompsKey
  ? {
      [K in Exclude<CapitalizedKeys<ComponentProps<Name>, 'on'>, keyof PublicProps>
        as K extends `on${infer Event}` ? Uncapitalize<Event> : never]: NonNullable<ComponentProps<Name>[K]>;
    }
  : Record<string, (...args: any[]) => any>;

export type DefineEmitsArgs<Name extends string> = {
  [K in keyof DefineEmits<Name>]: DefineEmits<Name>[K] extends (...args: infer Args) => any ? Args : never;
};
