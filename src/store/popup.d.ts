import type { GlobalComponents, PublicProps, DefineComponent } from 'vue'

// 筛选固定前缀的对象
type CapitalizedKeys<T, P extends string> = {
  [K in keyof T]: K extends `${P}${infer S}` ? S extends Capitalize<S> ? K : never : never 
}[keyof T]

/** 平铺展示 */
type Prettify<T> = { [K in keyof T]: T[K] } & {}
/** 分割`=`字符串 */
type ParseValue<S extends string> = S extends `${infer K}=${infer V}` ? { [T in K]: V } : { [T in S]: true };
/** 分割`&`字符串 */
type ParseParams<S extends string> = S extends `${infer P}&${infer O}` ? ParseValue<P> & ParseParams<O> : ParseValue<S>;
/** 分割`?`字符串 */
type SplitParams<S extends string> = S extends `${infer N}?${infer P}` ? [N, Prettify<ParseParams<P>>] : [S, any];
/** 获取组件名字 */
type FormatName<Name extends string> = SplitParams<Name>[0] extends PopupCompsKey
  ? SplitParams<Name>[0]
  : never;

/** 获取`Popup`开头的全局组件 */
export type PopupComps  = Pick<GlobalComponents, CapitalizedKeys<GlobalComponents  , `Popup`>>;
/** 获取`Popup`开头的全局组件 */
export type PopupCompsKey = keyof PopupComps

export type FilterProps<Name extends PopupCompsKey> = Omit<
  InstanceType<PopupComps[Name]>['$props'],
  keyof PublicProps | NonNullable<CapitalizedKeys<InstanceType<PopupComps[Name]>['$props'], 'on'>>
>;

export type FilterEmits<Name extends PopupCompsKey> = Omit<
  Pick<
    InstanceType<PopupComps[Name]>['$props'], 
    NonNullable<CapitalizedKeys<InstanceType<PopupComps[Name]>['$props'], 'on'>>
  >,
  keyof PublicProps
>;

type ToEmits<T> = {
  readonly [K in keyof T as
    K extends `on${infer Event}`
      ? Uncapitalize<Event>
      : never
  ]?:
    NonNullable<T[K]>
}
type ToEmitsArgs<T> = {
  readonly [K in keyof T as
    K extends `on${infer Name}`
      ? Uncapitalize<Name>
      : never
  ]?:
    NonNullable<T[K]> extends (...args: infer Args) => any
      ? Args
      : never
}

export type DefineProps<Name> = Prettify<FilterProps<Name>>
export type DefineEmits<Name> = ToEmits<FilterEmits<Name>>
export type DefineEmitsArgs<Name> = ToEmitsArgs<FilterEmits<Name>>
