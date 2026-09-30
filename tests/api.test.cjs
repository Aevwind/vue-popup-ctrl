const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { nextTick, createSSRApp, h, reactive, readonly, ref } = require('vue');
const { renderToString } = require('vue/server-renderer');
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

test('popup props preserve reactive references and updates in both directions', () => {
  const entity = reactive({ title: 'original' });
  const popup = store.open('PopupAudit', { entity });

  assert.equal(popup.data.entity, entity);
  entity.title = 'updated';
  assert.equal(popup.data.entity.title, 'updated');
  popup.data.entity.title = 'from popup';
  assert.equal(entity.title, 'from popup');
});

test('popup props preserve cyclic object and array references', () => {
  const entity = { title: 'original' };
  entity.parent = entity;
  const items = [entity];
  const popup = store.open('PopupAudit', { entity, items });

  assert.equal(popup.data.entity, entity);
  assert.equal(popup.data.entity.parent, entity);
  assert.equal(popup.data.items, items);
  assert.equal(popup.data.items[0], entity);
});

test('popup props preserve refs, readonly objects, and class instances when replaced', () => {
  class Entity {
    constructor(title) { this.title = title; }
  }
  const model = ref('original');
  const settings = readonly({ color: 'blue' });
  const entity = new Entity('original');
  const props = { model, settings, entity };
  const popup = store.open('PopupAudit', { ...props, initialOnly: true });

  assert.equal(popup.data.model, model);
  assert.equal(popup.data.settings, settings);
  assert.equal(popup.data.entity, entity);
  popup.props({ ...props, title: undefined });
  assert.equal(popup.data.model, model);
  assert.equal(popup.data.settings, settings);
  assert.equal(popup.data.entity, entity);
  assert.equal(Object.hasOwn(popup.data, 'initialOnly'), false);
  assert.equal(Object.hasOwn(popup.data, 'title'), true);
  model.value = 'updated';
  assert.equal(popup.data.model.value, 'updated');
});

test('Vue components receive original prop references and updated values', async () => {
  const entity = reactive({ title: 'original' });
  const model = ref('first');
  const settings = readonly({ color: 'blue' });
  const popup = store.open('PopupAudit', { entity, model, settings });
  const child = {
    props: ['entity', 'model', 'settings'],
    setup(props) {
      assert.equal(props.entity, entity);
      assert.equal(props.model, model);
      assert.equal(props.settings, settings);
      return () => h('span', `${props.entity.title}:${props.model.value}`);
    }
  };
  const render = () => renderToString(createSSRApp({ render: () => h(child, popup.data) }));

  assert.equal(await render(), '<span>original:first</span>');
  entity.title = 'updated';
  model.value = 'second';
  assert.equal(await render(), '<span>updated:second</span>');
});

test('cached props merge shallowly without mutating either caller-owned object', () => {
  const cached = { id: 'cached', settings: { color: 'blue', size: 1 } };
  const explicit = { id: 'explicit', settings: { color: 'red' }, title: 'confirm' };
  const popup = store.props(cached).open('PopupAudit', explicit);

  assert.deepEqual(popup.data, {
    id: 'explicit',
    settings: { color: 'red' },
    title: 'confirm'
  });
  assert.deepEqual(cached, { id: 'cached', settings: { color: 'blue', size: 1 } });
  assert.deepEqual(explicit, { id: 'explicit', settings: { color: 'red' }, title: 'confirm' });
  assert.equal(popup.data.settings, explicit.settings);
});

test('cached props preserve cyclic reactive references and are consumed once', () => {
  const entity = reactive({ title: 'original' });
  entity.parent = entity;
  const first = store.props({ entity }).open('PopupAudit');
  const second = store.open('PopupAudit');

  assert.equal(first.data.entity, entity);
  assert.equal(first.data.entity.parent, entity);
  entity.title = 'updated';
  assert.equal(first.data.entity.title, 'updated');
  assert.deepEqual(second.data, {});
});

test('undefined props do not overwrite cached values', () => {
  const popup = store.props({ id: 'cached' })
    .open('PopupAudit', { id: undefined, title: undefined });

  assert.deepEqual(popup.data, { id: 'cached' });
});

test('cached props are consumed once and query props retain precedence', () => {
  const first = store.props({ id: 'cached', cachedOnly: true })
    .open('PopupAudit?id=query', { id: 'explicit' });
  const second = store.open('PopupAudit', { id: 'second' });

  assert.deepEqual(first.data, { id: 'query', cachedOnly: true });
  assert.deepEqual(second.data, { id: 'second' });
});

test('cached props can be merged when caller-owned objects are frozen', () => {
  const cached = Object.freeze({
    id: 'cached',
    settings: Object.freeze({ color: 'blue', size: 1 })
  });
  const explicit = Object.freeze({
    id: 'explicit',
    settings: Object.freeze({ color: 'red' })
  });
  const popup = store.props(cached).open('PopupAudit', explicit);

  assert.deepEqual(popup.data, { id: 'explicit', settings: { color: 'red' } });
  assert.equal(popup.data.settings, explicit.settings);
});

test('props merging filters unsafe top-level keys without traversing nested data', () => {
  const nested = { constructor: 'business value' };
  const props = JSON.parse('{"__proto__":{"polluted":true},"constructor":"invalid","prototype":"invalid"}');
  props.nested = nested;
  const popup = store.props(props).open('PopupAudit?constructor=query&prototype=query');

  assert.equal(Object.hasOwn(popup.data, '__proto__'), false);
  assert.equal(Object.hasOwn(popup.data, 'constructor'), false);
  assert.equal(Object.hasOwn(popup.data, 'prototype'), false);
  assert.equal(popup.data.nested, nested);
  assert.equal(popup.data.nested.constructor, 'business value');
  assert.equal({}.polluted, undefined);
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

test('resolved event Promises preserve close interception until explicitly allowed', async () => {
  const popup = store.open('PopupAudit');
  const result = popup.on('confirm');
  let calls = 0;
  let allowClose;
  const intercept = close => { calls++; allowClose = close; };
  popup.on('close', intercept);

  emit(popup, 'confirm', { ok: true });
  assert.deepEqual(await result, { ok: true });
  popup.close();
  popup.close();
  await nextTick();
  assert.equal(calls, 2);
  assert.equal(popup.closing, false);
  assert.equal(store.popupList.length, 1);

  allowClose();
  await nextTick();
  assert.equal(store.popupList.length, 0);
});

test('cancelled event Promises preserve interception on repeated close requests', async () => {
  const popup = store.open('PopupAudit');
  let calls = 0;
  const intercept = () => calls++;
  popup.on('close', intercept);
  const cancellation = popup.on('confirm').then(
    () => assert.fail('closing before confirm must reject'),
    close => close
  );

  popup.close();
  const close = await cancellation;
  assert.equal(typeof close, 'function');
  popup.close();
  await nextTick();
  assert.equal(calls, 2);
  assert.equal(popup.closing, false);
  assert.equal(store.popupList.length, 1);

  close();
  await nextTick();
  assert.equal(store.popupList.length, 0);
});

test('resolved event Promises allow default closing after user interception is removed', async () => {
  const popup = store.open('PopupAudit');
  const result = popup.on('confirm');
  const intercept = () => {};
  popup.on('close', intercept);
  emit(popup, 'confirm', true);
  assert.equal(await result, true);

  popup.un('close', intercept).close();
  await nextTick();
  assert.equal(store.popupList.length, 0);
});

test('cancelling multiple Promises does not skip later close listeners during dispatch', async () => {
  const popup = store.open('PopupAudit');
  const cancellations = ['confirm', 'cancel'].map(event => popup.on(event).then(
    () => assert.fail('closing before the event must reject'),
    close => close
  ));
  let calls = 0;
  popup.on('close', () => calls++);

  const child = {
    setup(_, { emit }) {
      emit('close');
      return () => null;
    }
  };
  await renderToString(createSSRApp({ render: () => h(child, { onClose: popup.event.close }) }));
  assert.equal(calls, 1);
  const closeFunctions = await Promise.all(cancellations);
  assert.ok(closeFunctions.every(close => typeof close === 'function'));
  popup.close();
  await nextTick();
  assert.equal(calls, 2);
  assert.equal(popup.closing, false);
  assert.equal(store.popupList.length, 1);
});

test('settling multiple event Promises does not skip component event callbacks', async () => {
  const popup = store.open('PopupAudit');
  const results = [popup.on('confirm'), popup.on('confirm')];
  const payload = { ok: true };
  let calls = 0;
  popup.on('confirm', value => {
    assert.equal(value, payload);
    calls++;
  });
  const child = {
    setup(_, { emit }) {
      emit('confirm', payload);
      return () => null;
    }
  };

  await renderToString(createSSRApp({ render: () => h(child, { onConfirm: popup.event.confirm }) }));
  assert.equal(calls, 1);
  assert.deepEqual(await Promise.all(results), [payload, payload]);
  popup.close();
  await nextTick();
  assert.equal(store.popupList.length, 0);
});

test('settling an event Promise inside a close interceptor does not force closing', async () => {
  const popup = store.open('PopupAudit');
  const intercept = () => emit(popup, 'confirm', true);
  popup.on('close', intercept);
  const result = popup.on('confirm');

  popup.close();
  assert.equal(await result, true);
  await nextTick();
  assert.equal(popup.closing, false);
  assert.equal(store.popupList.length, 1);

  popup.un('close', intercept).close();
  await nextTick();
  assert.equal(store.popupList.length, 0);
});

test('a close interceptor registered after Promise cancellation can veto later requests', async () => {
  const popup = store.open('PopupAudit');
  const cancellation = popup.on('confirm').catch(close => close);
  popup.close();
  const close = await cancellation;
  await nextTick();
  assert.equal(popup.closing, false);
  assert.equal(store.popupList.length, 1);

  let calls = 0;
  popup.on('close', () => calls++);
  popup.close();
  await nextTick();
  assert.equal(calls, 1);
  assert.equal(popup.closing, false);
  assert.equal(store.popupList.length, 1);

  close();
  await nextTick();
  assert.equal(store.popupList.length, 0);
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
  assert.equal(popup.closing, false);
  assert.equal(store.popupList.length, 1);
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
    const disabled = store[method]('PopupAudit?id=' + method);
    assert.equal(disabled.disabled, true);
    assert.equal(await disabled.on('confirm'), undefined);
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
