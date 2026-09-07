import library = require('vue-popup-ctrl');
import { createApp } from 'vue';

createApp({}).use(library.default, { maskClose: true });
const config: library.PopupConfig = { opacity: 0, maskStyle: [null, 'background: red'] };
library.usePopupStore(config).open('PopupTyped', { id: 2 });
// @ts-expect-error CommonJS consumers receive the same prop checks
library.usePopupStore().open('PopupTyped', { id: false });
