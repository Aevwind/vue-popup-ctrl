import type { ComponentPublicInstance, GlobalComponents, PublicProps } from 'vue';

type CapitalizedKeys<T, Prefix extends string> = {
  [K in keyof T]: K extends `${Prefix}${infer S}`
    ? S extends Capitalize<S> ? K : never
    : never;
}[keyof T];

type Prettify<T> = { [K in keyof T]: T[K] } & {};
type ComponentName<Name extends string> = Name extends `${infer Base}?${string}` ? Base : Name;

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

export type DefineEmits<Name extends string> = ComponentName<Name> extends PopupCompsKey
  ? {
      [K in Exclude<CapitalizedKeys<ComponentProps<Name>, 'on'>, keyof PublicProps>
        as K extends `on${infer Event}` ? Uncapitalize<Event> : never]: NonNullable<ComponentProps<Name>[K]>;
    }
  : Record<string, (...args: any[]) => any>;

export type DefineEmitsArgs<Name extends string> = {
  [K in keyof DefineEmits<Name>]: DefineEmits<Name>[K] extends (...args: infer Args) => any ? Args : never;
};
