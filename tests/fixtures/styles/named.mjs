import { PopupCtrl, usePopupStore } from 'vue-popup-ctrl';
import { mountExample } from './mount.mjs';

mountExample({ component: PopupCtrl, store: usePopupStore(), label: '具名组件' });
