import library = require('vue-popup-ctrl');
import { createApp } from 'vue';

createApp({}).use(library.default, { maskClose: true });
const config: library.PopupConfig = { opacity: 0, maskStyle: [null, 'background: red'] };
library.usePopupStore(config).open('PopupTyped', { id: 2 });
type IsAny<T> = 0 extends (1 & T) ? true : false;
type Equal<Left, Right> = (<T>() => T extends Left ? 1 : 2) extends
  (<T>() => T extends Right ? 1 : 2) ? true : false;
type Assert<Condition extends true> = Condition;
const store = library.usePopupStore().props({ id: 3 }).config({ opacity: 0 });
type TypedStoreChain = Assert<Equal<IsAny<typeof store>, false>>;
const popup = store.open('PopupTyped?id=2&empty=', { id: 2 });
type QueryId = Assert<Equal<typeof popup.data.id, '2'>>;
type QueryEmpty = Assert<Equal<typeof popup.data.empty, true>>;
type QueryName = Assert<Equal<typeof popup.name, 'PopupTyped'>>;
const replaced = popup.props({ id: 3 }).config({ opacity: 0 }).on('confirm', () => {}).un('confirm', () => {});
type ReplacedId = Assert<Equal<typeof replaced.data.id, number>>;
// @ts-expect-error CommonJS consumers cannot omit required props without a cache
library.usePopupStore().open('PopupTyped');
const cached = library.usePopupStore().props({ id: 4 }).open('PopupTyped');

type CachedId = Assert<Equal<typeof cached.data.id, number | undefined>>;
// @ts-expect-error CommonJS consumers receive cached prop validation
library.usePopupStore().props({ id: 'wrong' }).open('PopupTyped');
const correctedCache = library.usePopupStore().props({ id: 'wrong' }).open('PopupTyped', { id: 4 });

type CorrectedCacheId = Assert<Equal<typeof correctedCache.data.id, number>>;
// @ts-expect-error CommonJS Store chaining must retain registered prop checks
store.open('PopupTyped', { id: false });
// @ts-expect-error CommonJS query data must reflect runtime string overrides
const wrongQueryId: number = popup.data.id;
// @ts-expect-error replacing props removes query-only keys
replaced.data.empty;
// @ts-expect-error CommonJS consumers receive the same prop checks
library.usePopupStore().open('PopupTyped', { id: false });
