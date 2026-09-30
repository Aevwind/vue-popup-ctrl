import Plugin, { usePopupStore, PopupCtrl, type PopupConfig } from 'vue-popup-ctrl';
import { createApp, defineComponent } from 'vue';

const TypedPopup = defineComponent({
  props: { id: { type: Number, required: true }, title: String },
  emits: { confirm: (value: { ok: boolean }) => typeof value.ok === 'boolean' },
  setup() { return { done: () => true }; }
});

const PairPopup = defineComponent({
  props: { id: { type: Number, required: true }, label: { type: String, required: true } }
});

declare module 'vue' {
  interface GlobalComponents {
    PopupTyped: typeof TypedPopup;
    PopupPair: typeof PairPopup;
  }
}

createApp({}).use(Plugin, { maskClose: true });
const controllerProps: InstanceType<typeof PopupCtrl>['$props'] = { opacity: 0.2, bgBlur: true };
// @ts-expect-error the public controller signature must retain prop types
const invalidControllerProps: InstanceType<typeof PopupCtrl>['$props'] = { opacity: '0.2' };
const config: PopupConfig = { opacity: 0, maskStyle: null };
const store = usePopupStore(config);
type IsAny<T> = 0 extends (1 & T) ? true : false;
type Equal<Left, Right> = (<T>() => T extends Left ? 1 : 2) extends
  (<T>() => T extends Right ? 1 : 2) ? true : false;
type Assert<Condition extends true> = Condition;
const storeChain = store.props({ id: 3 }).config({ opacity: 0 });
type TypedStoreChain = Assert<Equal<IsAny<typeof storeChain>, false>>;
type TypedPropsReturn = Assert<Equal<IsAny<ReturnType<typeof store.props>>, false>>;
type TypedConfigReturn = Assert<Equal<IsAny<ReturnType<typeof store.config>>, false>>;
const storeChainPopup = storeChain.open('PopupTyped', { id: 3 });
type TypedChainData = Assert<Equal<IsAny<typeof storeChainPopup.data.id>, false>>;
type ChainId = Assert<Equal<typeof storeChainPopup.data.id, number>>;
type TypedChainRef = Assert<Equal<IsAny<typeof storeChainPopup.ref>, false>>;
// @ts-expect-error Store chaining must preserve registered prop validation
store.config({ opacity: 0 }).props({ id: 3 }).open('PopupTyped', { id: 'wrong' });
// @ts-expect-error Store chaining must preserve event payload validation
storeChainPopup.on('confirm', value => { const wrong: number = value.ok; void wrong; });
const popup = store.open('PopupTyped', { id: 1 });
const instanceResult: boolean | undefined = popup.ref?.done();
const chainedInstance: boolean | undefined = popup.config({ opacity: 0 }).props({ id: 2 }).on('confirm', () => {}).ref?.done();
const chainedShow: boolean = popup.un('confirm', () => {}).show;
const result: Promise<{ ok: boolean } | undefined> = popup.on('confirm');
const closePromise = popup.on('close');

type CloseEventResult = Assert<Equal<Awaited<typeof closePromise>, (() => void) | undefined>>;
type CloseResult = Assert<Equal<ReturnType<typeof popup.close>, void | Promise<void>>>;
popup.on('confirm', value => { const ok: boolean = value.ok; void ok; });
popup.on('close', close => close());
const queryPopup = store.open('PopupTyped?id=1&flag&empty=&id=2', { id: 1 });
type QueryId = Assert<Equal<typeof queryPopup.data.id, '2'>>;
type QueryFlag = Assert<Equal<typeof queryPopup.data.flag, true>>;
type QueryEmpty = Assert<Equal<typeof queryPopup.data.empty, true>>;
type QueryTitle = Assert<Equal<typeof queryPopup.data.title, unknown>>;
type QueryName = Assert<Equal<typeof queryPopup.name, 'PopupTyped'>>;
const queryInstance: boolean | undefined = queryPopup.ref?.done();
// @ts-expect-error query overrides numeric input props with a string at runtime
const queryNumber: number = queryPopup.data.id;
// @ts-expect-error query must not loosen validation of the input props object
store.open('PopupTyped?id=1', { id: 'wrong' });
const replacedQuery = queryPopup.props({ id: 4 }).config({ opacity: 0 }).on('confirm', () => {}).un('confirm', () => {});
type ReplacedId = Assert<Equal<typeof replacedQuery.data.id, number>>;
// @ts-expect-error popup.props replaces data and does not reapply the original query
replacedQuery.data.flag;
// Mutable aliases retain their existing static type; use the returned handle after replacement.
type OriginalQueryId = Assert<Equal<typeof queryPopup.data.id, '2'>>;
const queryTokens = store.open('PopupTyped?id=7=discarded&flag=false&empty=&bool&encoded=%31?ignored', { id: 7 });
type TokenId = Assert<Equal<typeof queryTokens.data.id, '7'>>;
type TokenFlag = Assert<Equal<typeof queryTokens.data.flag, 'false'>>;
type TokenEmpty = Assert<Equal<typeof queryTokens.data.empty, true>>;
type TokenBool = Assert<Equal<typeof queryTokens.data.bool, true>>;
type TokenEncoded = Assert<Equal<typeof queryTokens.data.encoded, '%31'>>;
const filteredQuery = store.open('PopupTyped?__proto__=bad&constructor=bad&prototype=bad', { id: 1 });
type FilteredQueryKeys = Assert<Equal<Extract<keyof typeof filteredQuery.data, '__proto__' | 'constructor' | 'prototype'>, never>>;
declare const dynamicValue: string;
declare const dynamicQuery: string;
declare const dynamicNumber: number;
const dynamicValuePopup = store.open(`PopupTyped?id=${dynamicValue}` as const, { id: 1 });
type DynamicValueId = Assert<Equal<typeof dynamicValuePopup.data.id, number | string | true>>;
type DynamicValueTitle = Assert<Equal<typeof dynamicValuePopup.data.title, unknown>>;
type DynamicValueExtra = Assert<Equal<typeof dynamicValuePopup.data.extra, unknown>>;
// @ts-expect-error an empty dynamic query value becomes true, and extra segments can override props
const dynamicStringId: string = dynamicValuePopup.data.id;
const dynamicQueryPopup = store.open(`PopupTyped?${dynamicQuery}` as const, { id: 1 });
type DynamicQueryId = Assert<Equal<typeof dynamicQueryPopup.data.id, number | string | true>>;
type DynamicQueryExtra = Assert<Equal<typeof dynamicQueryPopup.data.extra, unknown>>;
// @ts-expect-error an unknown query key cannot be assumed to be a true flag
const dynamicFlag: true = dynamicQueryPopup.data.extra;
const dynamicSuffixPopup = store.open(`PopupTyped?id=prefix${dynamicValue}suffix` as const, { id: 1 });
type DynamicSuffixId = Assert<Equal<typeof dynamicSuffixPopup.data.id, number | string | true>>;
const dynamicNumberPopup = store.open(`PopupTyped?id=${dynamicNumber}` as const, { id: 1 });
type DynamicNumberId = Assert<Equal<typeof dynamicNumberPopup.data.id, number | string | true>>;
const longQueryPopup = store.open('PopupTyped?id=123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890', { id: 1 });
type LongQueryId = Assert<Equal<typeof longQueryPopup.data.id, number | string | true>>;
const manyFlagsPopup = store.open('PopupTyped?a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a&a', { id: 1 });
type ManyFlagsId = Assert<Equal<typeof manyFlagsPopup.data.id, number | string | true>>;
const onlyQuery = store.only('PopupTyped?id=3', { id: 3 });
const dailyQuery = store.daily('PopupTyped?id=4', { id: 4 });
const onceQuery = store.once('PopupTyped?id=5', { id: 5 });
const bottomQuery = store.bottom('PopupTyped?id=6', { id: 6 });
const createdQuery = store.createPopup('PopupTyped?id=7', { id: 7 });
type OnlyQueryId = Assert<Equal<typeof onlyQuery.data.id, unknown>>;
// @ts-expect-error an existing only popup may have replaced its original query data
const unsafeOnlyQueryId: '3' = onlyQuery.data.id;
type DailyQueryId = Assert<Equal<typeof dailyQuery.data.id, '4'>>;
type OnceQueryId = Assert<Equal<typeof onceQuery.data.id, '5'>>;
type BottomQueryId = Assert<Equal<typeof bottomQuery.data.id, '6'>>;
type CreatedQueryId = Assert<Equal<typeof createdQuery.data.id, '7'>>;

const explicitReuseOpen = store.open('PopupTyped?id=3', { id: 3 }, { only: true });
const explicitReuseCreate = store.createPopup('PopupTyped', { id: 3 }, { only: true });
const explicitReuseDaily = store.daily('PopupTyped', { id: 3 }, { only: true });
const explicitReuseOnce = store.once('PopupTyped', { id: 3 }, { only: true });
const explicitReuseBottom = store.bottom('PopupTyped', { id: 3 }, { only: true });

type ExplicitReuseData = Assert<Equal<[
  typeof explicitReuseOpen.data.id, typeof explicitReuseCreate.data.id,
  typeof explicitReuseDaily.data.id, typeof explicitReuseOnce.data.id, typeof explicitReuseBottom.data.id
], [unknown, unknown, unknown, unknown, unknown]>>;
declare const possibleOnly: boolean;
const possibleReuseOpen = store.open('PopupTyped', { id: 3 }, { only: possibleOnly });
const possibleReuseCreate = store.createPopup('PopupTyped', { id: 3 }, { only: possibleOnly });
const possibleReuseDaily = store.daily('PopupTyped', { id: 3 }, { only: possibleOnly });
const possibleReuseOnce = store.once('PopupTyped', { id: 3 }, { only: possibleOnly });
const possibleReuseBottom = store.bottom('PopupTyped', { id: 3 }, { only: possibleOnly });

type PossibleReuseData = Assert<Equal<[
  typeof possibleReuseOpen.data.id, typeof possibleReuseCreate.data.id,
  typeof possibleReuseDaily.data.id, typeof possibleReuseOnce.data.id, typeof possibleReuseBottom.data.id
], [unknown, unknown, unknown, unknown, unknown]>>;
const wideReuseOpen = store.open('PopupTyped', { id: 3 }, config);
const wideReuseCreate = store.createPopup('PopupTyped', { id: 3 }, config);
const wideReuseDaily = store.daily('PopupTyped', { id: 3 }, config);
const wideReuseOnce = store.once('PopupTyped', { id: 3 }, config);
const wideReuseBottom = store.bottom('PopupTyped', { id: 3 }, config);

type WideReuseData = Assert<Equal<[
  typeof wideReuseOpen.data.id, typeof wideReuseCreate.data.id,
  typeof wideReuseDaily.data.id, typeof wideReuseOnce.data.id, typeof wideReuseBottom.data.id
], [unknown, unknown, unknown, unknown, unknown]>>;
const freshOpen = store.open('PopupTyped?id=3', { id: 3 }, { only: false });
const freshCreate = store.createPopup('PopupTyped', { id: 3 }, { only: false });
const freshDaily = store.daily('PopupTyped', { id: 3 }, { only: false });
const freshOnce = store.once('PopupTyped', { id: 3 }, { only: false });
const freshBottom = store.bottom('PopupTyped', { id: 3 }, { only: false });

type FreshData = Assert<Equal<[
  typeof freshOpen.data.id, typeof freshCreate.data.id,
  typeof freshDaily.data.id, typeof freshOnce.data.id, typeof freshBottom.data.id
], ['3', number, number, number, number]>>;
const namedOpen = store.open<'PopupTyped'>('PopupTyped', { id: 3 });
const namedCreate = store.createPopup<'PopupTyped'>('PopupTyped', { id: 3 });
const namedOnly = store.only<'PopupTyped'>('PopupTyped', { id: 3 });
const namedDaily = store.daily<'PopupTyped'>('PopupTyped', { id: 3 });
const namedOnce = store.once<'PopupTyped'>('PopupTyped', { id: 3 });
const namedBottom = store.bottom<'PopupTyped'>('PopupTyped', { id: 3 });

type NamedCompatibilityData = Assert<Equal<[
  typeof namedOpen.data.id, typeof namedCreate.data.id, typeof namedOnly.data.id,
  typeof namedDaily.data.id, typeof namedOnce.data.id, typeof namedBottom.data.id
], [unknown, unknown, unknown, unknown, unknown, unknown]>>;
// @ts-expect-error specifying Name does not allow missing required input
store.open<'PopupTyped'>('PopupTyped');
// @ts-expect-error specifying Name does not allow wrong required input
store.open<'PopupTyped'>('PopupTyped', { id: 'wrong' });
const namedCachedStore = store.props({ id: 3 });
const namedCachedPopup = namedCachedStore.open<'PopupTyped'>('PopupTyped');

type NamedCacheId = Assert<Equal<typeof namedCachedPopup.data.id, number | undefined>>;
const namedCachedReuse = namedCachedStore.open<'PopupTyped'>('PopupTyped', undefined, { only: true });

type NamedCachedReuseId = Assert<Equal<typeof namedCachedReuse.data.id, unknown>>;
const namedCachedFresh = namedCachedStore.open<'PopupTyped'>('PopupTyped', undefined, { only: false });

type NamedCachedFreshId = Assert<Equal<typeof namedCachedFresh.data.id, number | undefined>>;
// @ts-expect-error specifying Name still validates cached input
store.props({ id: 'wrong' }).open<'PopupTyped'>('PopupTyped');
store.open('UnregisteredPopup', { arbitrary: true });
// @ts-expect-error required props cannot be omitted without a cache
store.open('PopupTyped');
// @ts-expect-error an undefined required prop is skipped at runtime
store.open('PopupTyped', { id: undefined });
// @ts-expect-error createPopup enforces required props
store.createPopup('PopupTyped');
// @ts-expect-error only enforces required props
store.only('PopupTyped');
// @ts-expect-error daily enforces required props
store.daily('PopupTyped');
// @ts-expect-error once enforces required props
store.once('PopupTyped');
// @ts-expect-error bottom enforces required props
store.bottom('PopupTyped');
// @ts-expect-error query overrides do not loosen the input props contract
store.open('PopupTyped?id=8');
// @ts-expect-error query overrides do not loosen createPopup input validation
store.createPopup('PopupTyped?id=8', { id: 'wrong' });
// @ts-expect-error query overrides do not loosen only input validation
store.only('PopupTyped?id=8', { id: 'wrong' });
// @ts-expect-error query overrides do not loosen daily input validation
store.daily('PopupTyped?id=8', { id: 'wrong' });
// @ts-expect-error query overrides do not loosen once input validation
store.once('PopupTyped?id=8', { id: 'wrong' });
// @ts-expect-error query overrides do not loosen bottom input validation
store.bottom('PopupTyped?id=8', { id: 'wrong' });

const cachedStore = store.props({ id: 9 }).config({ opacity: 0 });
interface CachedTypedInput { id: number; title?: string; }
declare const interfaceInput: CachedTypedInput;
const interfaceCachedPopup = store.props(interfaceInput).open('PopupTyped');

type InterfaceCacheId = Assert<Equal<typeof interfaceCachedPopup.data.id, number | undefined>>;
const readonlyCachedPopup = store.props(Object.freeze({ id: 9 })).open('PopupTyped');

type ReadonlyCacheId = Assert<Equal<typeof readonlyCachedPopup.data.id, number | undefined>>;
const firstCachedPopup = cachedStore.open('PopupTyped');
// The same store can be consumed through another alias before either cached call.
store.open('UnregisteredPopup');
const reusedCachedPopup = cachedStore.open('PopupTyped');
const cachedCreatedPopup = cachedStore.createPopup('PopupTyped');
const cachedOnlyPopup = cachedStore.only('PopupTyped');
const cachedDailyPopup = cachedStore.daily('PopupTyped');
const cachedOncePopup = cachedStore.once('PopupTyped');
const cachedBottomPopup = cachedStore.bottom('PopupTyped');

type FirstCachedId = Assert<Equal<typeof firstCachedPopup.data.id, number | undefined>>;

type ReusedCachedId = Assert<Equal<typeof reusedCachedPopup.data.id, number | undefined>>;

type CachedCreatedId = Assert<Equal<typeof cachedCreatedPopup.data.id, number | undefined>>;

type CachedOnlyId = Assert<Equal<typeof cachedOnlyPopup.data.id, unknown>>;

type CachedDailyId = Assert<Equal<typeof cachedDailyPopup.data.id, number | undefined>>;

type CachedOnceId = Assert<Equal<typeof cachedOncePopup.data.id, number | undefined>>;

type CachedBottomId = Assert<Equal<typeof cachedBottomPopup.data.id, number | undefined>>;
const reusedOnlyPopup = store.only('PopupTyped', { id: 14 });

type ReusedOnlyId = Assert<Equal<typeof reusedOnlyPopup.data.id, unknown>>;
// @ts-expect-error only may return an existing popup whose cache was already consumed
const unsafeReusedId: number = reusedOnlyPopup.data.id;
// @ts-expect-error one-shot cache data cannot guarantee a number on a reusable alias
const unsafeCachedId: number = reusedCachedPopup.data.id;
const explicitCachedPopup = cachedStore.open('PopupTyped', { id: 10 });

type ExplicitCachedId = Assert<Equal<typeof explicitCachedPopup.data.id, number>>;

type ScopedTitle = Assert<Equal<typeof explicitCachedPopup.data.title, string | undefined>>;
store.props({ title: 123 });
const unscopedPopup = store.open('PopupTyped', { id: 10 });

type UnscopedTitle = Assert<Equal<typeof unscopedPopup.data.title, unknown>>;
// @ts-expect-error a root-store alias may have an untyped one-shot cache
const unsafeUnscopedTitle: string | undefined = unscopedPopup.data.title;
const explicitTitle = store.open('PopupTyped', { id: 10, title: 'explicit' });

type ExplicitTitle = Assert<Equal<typeof explicitTitle.data.title, string | undefined>>;
const skippedUndefined = cachedStore.open('PopupTyped', { id: undefined });

type SkippedUndefinedId = Assert<Equal<typeof skippedUndefined.data.id, number | undefined>>;
const cachedQueryPopup = cachedStore.open('PopupTyped?id=11');

type CachedQueryId = Assert<Equal<typeof cachedQueryPopup.data.id, '11'>>;
const cachedDynamicQueryPopup = cachedStore.open(`PopupTyped?id=${dynamicValue}` as const);

type CachedDynamicQueryId = Assert<Equal<typeof cachedDynamicQueryPopup.data.id, number | string | true | undefined>>;

const wrongCachedStore = store.props({ id: 'wrong' });
// @ts-expect-error cached props are checked when selecting the registered component
wrongCachedStore.open('PopupTyped');
// @ts-expect-error undefined does not overwrite an incompatible cache
wrongCachedStore.open('PopupTyped', { id: undefined });
const correctedCache = wrongCachedStore.open('PopupTyped', { id: 12 });

type CorrectedCacheId = Assert<Equal<typeof correctedCache.data.id, number>>;
// @ts-expect-error createPopup checks cached props
wrongCachedStore.createPopup('PopupTyped');
// @ts-expect-error only checks cached props
wrongCachedStore.only('PopupTyped');
// @ts-expect-error daily checks cached props
wrongCachedStore.daily('PopupTyped');
// @ts-expect-error once checks cached props
wrongCachedStore.once('PopupTyped');
// @ts-expect-error bottom checks cached props
wrongCachedStore.bottom('PopupTyped');
// @ts-expect-error the latest props call replaces the cache rather than merging it
cachedStore.props({ title: 'replacement' }).open('PopupTyped');
// @ts-expect-error possibly undefined cache fields do not satisfy required props
store.props({ id: undefined as number | undefined }).open('PopupTyped');
// @ts-expect-error undefined cache fields do not satisfy required props
store.props({ id: undefined }).open('PopupTyped');
const complementedPair = store.props({ id: 13 }).open('PopupPair', { label: 'pair' });

type ComplementedPairId = Assert<Equal<typeof complementedPair.data.id, number | undefined>>;

type ComplementedPairLabel = Assert<Equal<typeof complementedPair.data.label, string>>;
declare const partialPair: { id: number } | { label: string };
const unionPair = store.props({ id: 13, label: 'cached' }).open('PopupPair', partialPair);

type UnionPairId = Assert<Equal<typeof unionPair.data.id, number | undefined>>;

type UnionPairLabel = Assert<Equal<typeof unionPair.data.label, string | undefined>>;
declare const unionCache: { id: number } | { title: number };
// @ts-expect-error incompatible fields in any possible cached object are rejected
store.props(unionCache).open('PopupTyped', { id: 13 });
declare const indexedCache: Record<string, number>;
// @ts-expect-error index signatures can contain incompatible optional cached props
store.props(indexedCache).open('PopupTyped', { id: 13 });
const overwrittenIndexCache = store.props(indexedCache).open('PopupTyped', { id: 13, title: 'explicit' });

type OverwrittenIndexId = Assert<Equal<typeof overwrittenIndexCache.data.id, number>>;
// @ts-expect-error all required keys must come from explicit props or the cache
store.props({ id: 13 }).open('PopupPair');
// @ts-expect-error incompatible optional cached props are validated as well
store.props({ title: 123 }).open('PopupTyped', { id: 13 });
// @ts-expect-error registered props must retain their type
store.open('PopupTyped', { id: 'wrong' });
// @ts-expect-error typed callback data must not degrade to any
popup.on('confirm', value => { const wrong: number = value.ok; void wrong; });
// @ts-expect-error the inferred Promise must retain its payload type
const wrongResult: Promise<string> = popup.on('confirm');
void [PopupCtrl, result, instanceResult, wrongResult, chainedInstance, chainedShow, controllerProps, invalidControllerProps, queryInstance, queryNumber];
