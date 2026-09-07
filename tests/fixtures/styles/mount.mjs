import { createApp, h, inject, resolveComponent } from 'vue';

export function mountExample({ plugin, component, store, label }) {
  const app = createApp({
    setup() {
      const popupStore = inject('popupStore');
      return () => [
        h('h1', '自动样式验证'),
        h('p', `入口：${label}，未手动导入 CSS`),
        h('button', { onClick: () => popupStore.open('PopupStyleCheck', {}, { anime: 'none' }) }, '打开弹窗'),
        h('button', { onClick: () => popupStore.toast('提示样式正常', { duration: 10000 }) }, '显示提示'),
        h(component || resolveComponent('PopupCtrl'))
      ];
    }
  });
  app.component('PopupStyleCheck', {
    emits: ['close'],
    setup(_, { emit }) {
      return () => h('section', { style: { background: 'white', padding: '24px' } }, [
        h('p', '弹窗已打开'),
        h('button', { onClick: () => emit('close') }, '关闭弹窗')
      ]);
    }
  });
  if (plugin) app.use(plugin);
  else app.provide('popupStore', store);
  app.mount('#app');
}
