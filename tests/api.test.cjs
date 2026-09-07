const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { nextTick, createSSRApp, h } = require('vue');
const { renderToString } = require('@vue/server-renderer');
const library = require('vue-popup-ctrl');
const store = library.usePopupStore();

const emit = (popup, name, ...args) => {
  for (const handler of [...(popup.event[name] || [])]) handler(...args);
};
const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
};

afterEach(async () => {
  for (const popup of [...store.popupList]) store.close(popup.id);
  for (const toast of [...store.toastList]) toast.close();
  await nextTick();
  delete global.window;
});

test('CommonJS and ESM package entries can load without browser globals', async () => {
  assert.equal(typeof library.default.install, 'function');
  const esm = await import('vue-popup-ctrl');
  assert.equal(typeof esm.default.install, 'function');
  assert.equal(typeof esm.usePopupStore, 'function');
});

test('SSR renders the controller without accessing document or storage', async () => {
  const app = createSSRApp({ render: () => h(library.PopupCtrl) });
  app.use(library.default);
  const html = await renderToString(app);
  assert.equal(typeof html, 'string');
  assert.ok(!html.includes('popup_ctrl_mask'));
});

test('merging external JSON cannot pollute prototypes', () => {
  try {
    const config = JSON.parse('{"__proto__":{"__popupTestPolluted":true},"constructor":{"prototype":{"__popupTestPolluted":true}},"maskStyle":{"__proto__":{"__popupTestPolluted":true},"color":"red"}}');
    const popup = store.open('PopupAudit', {}, config);
    popup.config(config);
    assert.equal(({}).__popupTestPolluted, undefined);
    assert.equal(Object.hasOwn(popup.option, '__proto__'), false);
    assert.equal(Object.hasOwn(popup.option, 'constructor'), false);
    assert.equal(popup.option.maskStyle.color, 'red');
  } finally {
    delete Object.prototype.__popupTestPolluted;
  }
});

test('query props do not mutate caller-owned data', () => {
  const props = Object.freeze({ id: 'original' });
  const popup = store.open('PopupAudit?id=next', props);
  assert.equal(props.id, 'original');
  assert.equal(popup.data.id, 'next');
});

test('only deduplicates the complete name including query parameters', () => {
  const first = store.only('PopupAudit?id=1');
  const second = store.only('PopupAudit?id=2');
  assert.notEqual(first, second);
  assert.equal(store.only('PopupAudit?id=1'), first);
  assert.equal(second.data.id, '2');
  assert.equal(store.popupList.length, 2);
});

test('un removes a callback without removing an earlier Promise listener', async () => {
  const popup = store.open('PopupAudit');
  const result = popup.on('confirm');
  let calls = 0;
  const callback = () => calls++;
  popup.on('confirm', callback).un('confirm', callback);
  emit(popup, 'confirm', { ok: true });
  assert.deepEqual(await result, { ok: true });
  assert.equal(calls, 0);
});

test('close Promise and callback listeners can also be independently removed', async () => {
  const popup = store.open('PopupAudit');
  const result = popup.on('close');
  let calls = 0;
  const callback = () => calls++;
  popup.on('close', callback).un('close', callback);
  emit(popup, 'close');
  const close = await result;
  assert.equal(calls, 0);
  assert.equal(typeof close, 'function');
  close();
  await nextTick();
  assert.equal(store.popupList.length, 0);
});

test('store.close forcibly closes the last popup and never calls close listeners', async () => {
  let calls = 0;
  const first = store.open('PopupAudit');
  const last = store.open('PopupAudit');
  last.on('close', () => calls++);
  store.close();
  await nextTick();
  assert.equal(calls, 0);
  assert.equal(store.popupList.length, 1);
  assert.equal(store.popupList[0].id, first.id);
});

test('popup close remains interceptable and may be confirmed inside the callback', async () => {
  const popup = store.open('PopupAudit');
  const veto = () => {};
  popup.on('close', veto);
  popup.close();
  await nextTick();
  assert.equal(store.popupList.length, 1);
  popup.un('close', veto).on('close', () => popup.close());
  popup.close();
  await nextTick();
  assert.equal(store.popupList.length, 0);
});

test('closing before the first render does not reopen the popup', async () => {
  const popup = store.open('PopupAudit');
  store.close(popup.id);
  await nextTick();
  assert.equal(popup.show, false);
  assert.equal(store.popupList.length, 0);
});

test('daily and once still remember closes when browser storage is available', async () => {
  global.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage(), location: { origin: 'https://example.test' } };
  for (const method of ['daily', 'once']) {
    const popup = store[method]('PopupAudit?id=' + method);
    popup.close();
    await nextTick();
    assert.equal(store[method]('PopupAudit?id=' + method).disabled, true);
    assert.equal(store[method]('PopupAudit?id=other-' + method).disabled, false);
  }
});

test('blocked browser storage does not prevent daily/once popups', () => {
  global.window = { location: { origin: 'https://example.test' } };
  for (const key of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(window, key, { get() { throw new Error('Storage blocked'); } });
  }
  assert.doesNotThrow(() => store.daily('PopupAudit').close());
  assert.doesNotThrow(() => store.once('PopupAudit').close());
});
