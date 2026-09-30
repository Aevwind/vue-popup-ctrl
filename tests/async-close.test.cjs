const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createSSRApp, h, nextTick } = require('vue');
const { renderToString } = require('vue/server-renderer');
const library = require('vue-popup-ctrl');
const { createControllerHarness } = require('./helpers/controller-renderer.cjs');
const store = library.usePopupStore();

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  // Keep a failing implementation from leaking a rejection outside its test.
  promise.catch(() => {});
  return { promise, resolve, reject };
};

afterEach(async () => {
  for (const popup of [...store.popupList]) store.close(popup.id);
  for (const toast of [...store.toastList]) toast.close();
  await nextTick();
});

test('Vue component emits route rejected async close callbacks to the app error handler', async () => {
  const popup = store.open('AsyncCloseFixture');
  const pending = deferred();
  const failure = new Error('save failed');
  const errors = [];
  popup.on('close', () => pending.promise);
  const component = {
    emits: ['close'],
    setup(_, { emit }) {
      emit('close', 'payload');
      return () => h('section', 'Popup content');
    }
  };
  const app = createSSRApp({ render: () => h(component, { onClose: popup.event.close }) });
  app.config.errorHandler = (error, instance, info) => errors.push({ error, instance, info });

  await renderToString(app);
  pending.reject(failure);
  await nextTick();
  await nextTick();

  assert.equal(errors.length, 1);
  assert.equal(errors[0].error, failure);
  assert.equal(errors[0].info, 'component event handler');
  assert.equal(popup.closing, false);
  assert.ok(store.popupList.some(item => item.id === popup.id));
});

test('manual close returns a promise that waits for successful async interception', async () => {
  const popup = store.open('AsyncCloseFixture');
  const pending = deferred();
  let closePopup;
  popup.on('close', async close => {
    closePopup = close;
    await pending.promise;
    close();
  });

  const result = popup.close();
  assert.equal(typeof result?.then, 'function');
  assert.equal(typeof closePopup, 'function');
  assert.equal(popup.closing, false);
  pending.resolve();
  assert.equal(await result, undefined);
  assert.equal(popup.closing, true);
  await nextTick();
  assert.ok(!store.popupList.some(item => item.id === popup.id));
});

test('manual close exposes async rejection without automatically closing the popup', async () => {
  const popup = store.open('AsyncCloseFixture');
  const pending = deferred();
  const failure = new Error('save failed');
  popup.on('close', () => pending.promise);

  const result = popup.close();
  pending.reject(failure);
  assert.equal(typeof result?.then, 'function');
  await assert.rejects(result, error => error === failure);
  assert.equal(popup.closing, false);
  assert.ok(store.popupList.some(item => item.id === popup.id));
});

test('manual close waits for every successful async close listener', async () => {
  const popup = store.open('AsyncCloseFixture');
  const first = deferred();
  const second = deferred();
  popup.on('close', () => first.promise);
  popup.on('close', () => second.promise);

  const result = popup.close();
  assert.equal(typeof result?.then, 'function');
  let settled = false;
  result.then(() => { settled = true; }, () => {});
  first.resolve();
  await nextTick();
  assert.equal(settled, false);
  second.resolve();
  assert.equal(await result, undefined);
  assert.equal(settled, true);
  assert.equal(popup.closing, false);
});

test('synchronous close listeners keep their immediate undefined return and close behavior', async () => {
  const popup = store.open('AsyncCloseFixture');
  const calls = [];
  popup.on('close', (close, payload) => {
    calls.push(payload);
    close();
  });

  assert.equal(popup.close('saved'), undefined);
  assert.deepEqual(calls, ['saved']);
  assert.equal(popup.closing, true);
  await nextTick();
  assert.ok(!store.popupList.some(item => item.id === popup.id));
});

test('async rejection does not skip later close listeners', async () => {
  const popup = store.open('AsyncCloseFixture');
  const failed = deferred();
  const successful = deferred();
  const failure = new Error('first save failed');
  const calls = [];
  popup.on('close', () => {
    calls.push('first');
    return failed.promise;
  });
  popup.on('close', () => {
    calls.push('second');
    return successful.promise;
  });
  popup.on('close', () => calls.push('third'));

  const result = popup.close();
  assert.deepEqual(calls, ['first', 'second', 'third']);
  failed.reject(failure);
  successful.resolve();
  assert.equal(typeof result?.then, 'function');
  await assert.rejects(result, error => error === failure);
  assert.equal(popup.closing, false);
});

test('later close listener rejections stay handled after the aggregate has rejected', async () => {
  const popup = store.open('AsyncCloseFixture');
  const first = deferred();
  const firstFailure = new Error('first save failed');
  let rejectSecond;
  // Deliberately omit an independent catch: the close dispatcher must handle it.
  const second = new Promise((_, reject) => { rejectSecond = reject; });
  popup.on('close', () => first.promise);
  popup.on('close', () => second);

  const result = popup.close();
  first.reject(firstFailure);
  assert.equal(typeof result?.then, 'function');
  await assert.rejects(result, error => error === firstFailure);
  rejectSecond(new Error('second save failed later'));
  // Let Node report unhandled rejections before declaring the test complete.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(popup.closing, false);
});

test('a synchronous throw after an async listener is exposed by the returned promise', async () => {
  const popup = store.open('AsyncCloseFixture');
  const pending = deferred();
  const failure = new Error('second listener failed');
  popup.on('close', () => pending.promise);
  popup.on('close', () => { throw failure; });

  const result = popup.close();
  pending.resolve();
  assert.equal(typeof result?.then, 'function');
  await assert.rejects(result, error => error === failure);
  assert.equal(popup.closing, false);
});

test('purely synchronous close failures still throw synchronously', () => {
  const popup = store.open('AsyncCloseFixture');
  const failure = new Error('synchronous save failed');
  popup.on('close', () => { throw failure; });

  assert.throws(() => popup.close(), error => error === failure);
  assert.equal(popup.closing, false);
});

test('mask click handlers return the async close result for Vue error handling', async () => {
  const harness = await createControllerHarness({ maskClose: true });
  const pending = deferred();
  const failure = new Error('mask save failed');
  try {
    const popup = await harness.open();
    popup.on('close', () => pending.promise);
    const [mask] = harness.masks();
    const result = mask.props.onClick({
      target: mask,
      currentTarget: mask,
      stopPropagation() {}
    });
    pending.reject(failure);
    assert.equal(typeof result?.then, 'function');
    await assert.rejects(result, error => error === failure);
    assert.equal(popup.closing, false);
  } finally {
    await harness.cleanup();
  }
});
