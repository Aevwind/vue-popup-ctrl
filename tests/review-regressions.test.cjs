const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createSSRApp, h, nextTick, reactive, ref } = require('vue');
const { renderToString } = require('vue/server-renderer');
const library = require('vue-popup-ctrl');
const { createControllerHarness } = require('./helpers/controller-renderer.cjs');
const store = library.usePopupStore();

const emitFromVue = (popup, event, payload) => {
  const child = {
    emits: [event],
    setup(_, { emit }) {
      emit(event, payload);
      return () => null;
    }
  };
  const handlerName = 'on' + event[0].toUpperCase() + event.slice(1);
  return renderToString(createSSRApp({ render: () => h(child, { [handlerName]: popup.event[event] }) }));
};

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
};

const withStorage = t => {
  const previousWindow = Object.getOwnPropertyDescriptor(global, 'window');
  global.window = {
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
    location: { origin: 'https://review-regressions.test' }
  };
  t.after(() => {
    if (previousWindow) Object.defineProperty(global, 'window', previousWindow);
    else delete global.window;
  });
};

afterEach(async () => {
  for (const popup of [...store.popupList]) store.close(popup.id);
  for (const toast of [...store.toastList]) toast.close();
  await nextTick();
});

test('self-unbinding during a Vue emit preserves later Promise and callback listeners', async () => {
  const popup = store.open('ReviewFixture');
  const calls = [];
  const callback = value => {
    calls.push(['self', value]);
    popup.un('confirm', callback);
  };
  popup.on('confirm', callback);
  let settled = false;
  const result = popup.on('confirm').then(value => {
    settled = true;
    return value;
  });
  popup.on('confirm', value => calls.push(['last', value]));

  await emitFromVue(popup, 'confirm', 'first');
  assert.equal(settled, true, 'the Promise between callbacks is still notified');
  assert.equal(await result, 'first');
  await emitFromVue(popup, 'confirm', 'second');
  assert.deepEqual(calls, [['self', 'first'], ['last', 'first'], ['last', 'second']]);
});

test('unbinding an earlier callback during a Vue emit does not skip the following callback', async () => {
  const popup = store.open('ReviewFixture');
  const calls = [];
  const first = () => calls.push('first');
  popup.on('confirm', first);
  popup.on('confirm', () => {
    calls.push('second');
    popup.un('confirm', first);
  });
  popup.on('confirm', () => calls.push('third'));

  await emitFromVue(popup, 'confirm');
  await emitFromVue(popup, 'confirm');
  assert.deepEqual(calls, ['first', 'second', 'third', 'second', 'third']);
});

test('repeated emits through the same Vue listener array ignore removed and settled listeners', async () => {
  const popup = store.open('ReviewFixture');
  const calls = [];
  const callback = value => {
    calls.push(['self', value]);
    popup.un('confirm', callback);
  };
  popup.on('confirm', callback);
  let settled = false;
  const result = popup.on('confirm').then(value => {
    settled = true;
    return value;
  });
  popup.on('confirm', value => calls.push(['last', value]));
  const child = {
    emits: ['confirm'],
    setup(_, { emit }) {
      emit('confirm', 'first');
      emit('confirm', 'second');
      return () => null;
    }
  };

  await renderToString(createSSRApp({ render: () => h(child, { onConfirm: popup.event.confirm }) }));
  assert.equal(settled, true);
  assert.equal(await result, 'first');
  assert.deepEqual(calls, [['self', 'first'], ['last', 'first'], ['last', 'second']]);
});

for (const [method, flag, value] of [
  ['only', 'only', true],
  ['daily', 'type', 'daily'],
  ['once', 'type', 'once'],
  ['bottom', 'anime', 'bottom']
]) {
  test(`${method} accepts frozen configuration without leaking its flag into reused options`, () => {
    for (const frozen of [false, true]) {
      const options = { maskColor: '#456', opacity: 0.27, maskStyle: { color: 'blue' } };
      if (frozen) {
        Object.freeze(options.maskStyle);
        Object.freeze(options);
      }
      const popup = store[method](`ReviewFixture?helper=${method}&frozen=${frozen}`, {}, options);
      assert.equal(popup.option[flag], value);
      assert.deepEqual(options, { maskColor: '#456', opacity: 0.27, maskStyle: { color: 'blue' } });

      const plain = store.open(`ReviewFixture?reused=${method}&frozen=${frozen}`, {}, options);
      assert.equal(plain.option.only, false);
      assert.equal(plain.option.type, '');
      assert.equal(plain.option.anime, 'bounce');
      assert.equal(plain.option.maskColor, '#456');
    }
  });
}

test('default configuration snapshots nested objects and arrays without changing its cache key', () => {
  const options = {
    rootClassName: 'review-default-snapshot',
    maskColor: '#234',
    maskStyle: [{ color: 'red' }],
    confettiConf: [{ particleCount: 45, spread: 60, origin: { y: 0.45 }, zIndex: 42000 }]
  };
  const original = JSON.parse(JSON.stringify(options));
  const configured = library.usePopupStore(options);
  const first = configured.open('ReviewFixture');

  options.maskColor = '#999';
  options.maskStyle[0].color = 'blue';
  options.maskStyle.push({ color: 'green' });
  options.confettiConf[0].origin.y = 0.9;
  options.confettiConf[0].particleCount = 99;
  const second = configured.open('ReviewFixture');

  for (const popup of [first, second]) {
    assert.equal(popup.option.maskColor, original.maskColor);
    assert.deepEqual(popup.option.maskStyle, original.maskStyle);
    assert.deepEqual(popup.option.confettiConf, original.confettiConf);
  }
  assert.equal(library.usePopupStore(original), configured);
  const cached = library.usePopupStore(original).open('ReviewFixture');
  assert.equal(cached.option.maskColor, '#234');
  assert.deepEqual(cached.option.maskStyle, original.maskStyle);

  Reflect.set(configured.popupConfig, 'maskColor', '#abc');
  Reflect.set(configured.popupConfig.maskStyle[0], 'color', 'green');
  assert.equal(configured.popupConfig.maskColor, '#234');
  assert.deepEqual(configured.popupConfig.maskStyle, original.maskStyle);

  first.option.maskStyle[0].color = 'first-owned';
  first.option.confettiConf[0].origin.y = 0.2;
  assert.equal(first.option.maskStyle[0].color, 'first-owned');
  assert.deepEqual(second.option.maskStyle, original.maskStyle);
  assert.deepEqual(cached.option.confettiConf, original.confettiConf);
});

for (const method of ['daily', 'once']) {
  test(`${method} disabled handles resolve every event Promise and never invoke normal callbacks`, async t => {
    withStorage(t);
    const name = `ReviewFixture?disabled=${method}`;
    store[method](name).close();
    await nextTick();
    const popup = store[method](name);
    assert.equal(popup.disabled, true);
    assert.ok(!store.popupList.some(item => item.id === popup.id));

    const settled = [];
    popup.on('confirm').then(value => settled.push(['confirm', value]));
    popup.on('close').then(value => settled.push(['close', value]));
    let calls = 0;
    popup.on('confirm', () => calls++);
    let allowClose;
    const closeCalls = [];
    popup.on('close', (close, payload) => {
      allowClose = close;
      closeCalls.push(payload);
    });
    await nextTick();

    assert.deepEqual(settled, [['confirm', undefined], ['close', undefined]]);
    assert.equal(calls, 0);
    assert.deepEqual(closeCalls, []);
    assert.equal(popup.event.confirm?.length || 0, 0);
    assert.equal(popup.close('explicit'), undefined);
    assert.deepEqual(closeCalls, ['explicit']);
    assert.equal(typeof allowClose, 'function');
    assert.doesNotThrow(() => allowClose());
    assert.equal(calls, 0);
  });
}

test('mounted popup references return to undefined when the popup closes', async t => {
  const harness = await createControllerHarness();
  t.after(() => harness.cleanup());
  const popup = harness.store.open('PopupFixture');
  popup.transitionConfig = { css: false };
  assert.equal(popup.ref, undefined);
  await harness.flush();
  assert.ok(popup.ref, 'mounted component instance is available');

  harness.store.close(popup.id);
  await harness.flush();
  assert.equal(popup.ref, undefined);
});

test('controller unmount normalizes every mounted popup reference to undefined', async t => {
  const harness = await createControllerHarness();
  t.after(() => harness.cleanup());
  const first = await harness.open();
  const second = await harness.open();
  assert.ok(first.ref);
  assert.ok(second.ref);

  harness.unmount();
  await harness.flush();
  assert.equal(first.ref, undefined);
  assert.equal(second.ref, undefined);
});

test('cached props views are distinct store handles and consume their bound data once', () => {
  const view = store.props({ id: 'bound' });
  assert.notEqual(view, store);
  assert.equal(view.popupList, store.popupList);
  const first = view.config({ maskColor: '#246' }).open('ReviewFixture');
  const second = view.open('ReviewFixture');

  assert.deepEqual(first.data, { id: 'bound' });
  assert.equal(first.option.maskColor, '#246');
  assert.deepEqual(second.data, {});
  assert.equal(second.option.maskColor, undefined);
});

test('replaced props views cannot read or consume newer cached data', () => {
  const previous = store.props({ id: 'previous' });
  const current = store.props({ id: 'current' });
  assert.notEqual(previous, current);

  const stale = previous.open('ReviewFixture');
  assert.deepEqual(stale.data, {});
  const fresh = current.open('ReviewFixture');
  assert.deepEqual(fresh.data, { id: 'current' });
  assert.deepEqual(store.open('ReviewFixture').data, {});
});

test('root store consumption invalidates the corresponding cached props view', () => {
  const view = store.props({ id: 'root-consumed' });
  assert.deepEqual(store.open('ReviewFixture').data, { id: 'root-consumed' });
  assert.deepEqual(view.open('ReviewFixture').data, {});
});

test('props registration snapshots top-level values while retaining nested and ref identities', () => {
  const entity = reactive({ title: 'original' });
  const model = ref('original');
  const props = { id: 'original', entity, model };
  const view = store.props(props);
  props.id = 'replaced';
  props.entity = reactive({ title: 'replacement' });
  props.model = ref('replacement');
  entity.title = 'updated';
  model.value = 'updated';

  const popup = view.open('ReviewFixture');
  assert.equal(popup.data.id, 'original');
  assert.equal(popup.data.entity, entity);
  assert.equal(popup.data.entity.title, 'updated');
  assert.equal(popup.data.model, model);
  assert.equal(popup.data.model.value, 'updated');
  assert.deepEqual(view.open('ReviewFixture').data, {});
});
