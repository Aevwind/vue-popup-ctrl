const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createControllerHarness } = require('./helpers/controller-renderer.cjs');

const assertBodyActive = (body, blurred) => {
  assert.equal(body.style.getPropertyValue('overflow'), 'hidden');
  assert.equal(body.classList.contains('filter-blur'), blurred);
};
const assertBodyRestored = body => {
  assert.equal(body.style.getPropertyValue('overflow'), 'scroll');
  assert.equal(body.style.getPropertyPriority('overflow'), 'important');
  assert.equal(body.classList.contains('filter-blur'), false);
};
const topMasks = harness => harness.masks().filter(mask => mask.classList.contains('popup_ctrl_mask_top'));
const assertTopMask = (harness, expected) => {
  const masks = topMasks(harness);
  assert.equal(masks.length, 1, 'exactly one mask stays unblurred');
  assert.equal(masks[0] === expected, true, 'the highest effective layer stays unblurred');
};

test('popup masks occupy the viewport without a controller stacking context', () => {
  const css = readFileSync(resolve(__dirname, '../dist/vue-popup-ctrl.css'), 'utf8');
  const root = css.match(/(?:^|})\.popup_ctrl\{([^}]*)}/)?.[1] || '';
  const mask = css.match(/(?:^|})\.popup_ctrl \.popup_ctrl_mask\{([^}]*)}/)?.[1] || '';
  assert.ok(root, 'controller CSS exists');
  assert.doesNotMatch(root, /(?:position|z-index|transform|filter|opacity|isolation):/);
  assert.match(mask, /position:fixed/);
  assert.match(css, /\.popup_ctrl_mask:not\(\.popup_ctrl_mask_top\)[^}]*filter:blur/);
  assert.doesNotMatch(css, /popup_ctrl_mask:last-of-type/);
});

test('only the highest effective mask layer stays unblurred, with newest ties winning', async t => {
  const harness = await createControllerHarness({ bgBlur: true });
  t.after(() => harness.cleanup());
  const first = await harness.open({ zIndex: 300000 });
  const firstMask = harness.masks()[0];
  const second = await harness.open({ zIndex: 10000 });
  const secondMask = harness.masks()[1];
  assertTopMask(harness, firstMask);
  assert.equal(firstMask.style.zIndex, '300000');

  second.config({ maskStyle: [{ 'z-index': 400000 }] });
  await harness.flush();
  assertTopMask(harness, secondMask);

  first.config({ maskStyle: 'z-index: 400000;' });
  await harness.flush();
  assertTopMask(harness, secondMask);

  first.config({ maskStyle: { zIndex: 500000 } });
  await harness.flush();
  assertTopMask(harness, firstMask);
});

test('scroll lock and blur remain until the final mask finishes leaving', async t => {
  const harness = await createControllerHarness({ bgBlur: true });
  t.after(() => harness.cleanup());
  const leaves = [];
  const popup = await harness.open({}, (_element, done) => leaves.push(done));
  assertBodyActive(harness.body, true);

  harness.store.close(popup.id);
  await harness.flush();
  assert.equal(harness.store.popupList.length, 0);
  assert.equal(harness.masks().length, 1);
  assert.equal(leaves.length, 1);
  assertBodyActive(harness.body, true);

  leaves[0]();
  await harness.flush();
  assert.equal(harness.masks().length, 0);
  assertBodyRestored(harness.body);
});

test('closing before the first enter leaves no body effects behind', async t => {
  const harness = await createControllerHarness({ bgBlur: true });
  t.after(() => harness.cleanup());
  const leaves = [];
  const popup = harness.store.open('PopupFixture');
  popup.transitionConfig = { css: false, onLeave: (_element, done) => leaves.push(done) };
  harness.store.close(popup.id);
  await harness.flush();

  assert.equal(harness.store.popupList.length, 0);
  assert.equal(harness.masks().length, 0);
  assert.equal(leaves.length, 0);
  assertBodyRestored(harness.body);
});

test('overlapping reopen preserves body effects and tracks the leaving mask layer', async t => {
  const harness = await createControllerHarness({ bgBlur: true });
  t.after(() => harness.cleanup());
  const leaves = [];
  const first = await harness.open({ zIndex: 300000 }, (_element, done) => leaves.push(done));
  const firstMask = harness.masks()[0];
  harness.store.close(first.id);
  await harness.flush();
  const second = await harness.open({ zIndex: 200000 }, (_element, done) => leaves.push(done));
  const secondMask = harness.masks()[1];
  assert.equal(harness.masks().length, 2);
  assertTopMask(harness, firstMask);
  assertBodyActive(harness.body, true);

  leaves[0]();
  await harness.flush();
  assertTopMask(harness, secondMask);
  assertBodyActive(harness.body, true);

  harness.store.close(second.id);
  await harness.flush();
  assertBodyActive(harness.body, true);
  leaves[1]();
  await harness.flush();
  assertBodyRestored(harness.body);
});

test('a higher reopened popup removes the top marker from a lower leaving mask', async t => {
  const harness = await createControllerHarness({ bgBlur: true });
  t.after(() => harness.cleanup());
  const leaves = [];
  const first = await harness.open({ zIndex: 10000 }, (_element, done) => leaves.push(done));
  const leavingMask = harness.masks()[0];
  assertTopMask(harness, leavingMask);

  harness.store.close(first.id);
  await harness.flush();
  await harness.open({ zIndex: 20000 });
  const reopenedMask = harness.masks()[1];
  assert.equal(leavingMask.classList.contains('popup_ctrl_mask_top'), false);
  assertTopMask(harness, reopenedMask);
  assertBodyActive(harness.body, true);

  leaves[0]();
  await harness.flush();
  assert.equal(harness.masks().length, 1);
  assertTopMask(harness, reopenedMask);
  assertBodyActive(harness.body, true);
});

test('controller unmount restores body effects even with an unfinished leave', async t => {
  const harness = await createControllerHarness({ bgBlur: true });
  t.after(() => harness.cleanup());
  const leaves = [];
  const popup = await harness.open({}, (_element, done) => leaves.push(done));
  harness.store.close(popup.id);
  await harness.flush();
  assertBodyActive(harness.body, true);

  harness.unmount();
  assertBodyRestored(harness.body);
  leaves[0]();
  await harness.flush();
  assertBodyRestored(harness.body);
});

test('rgba decimal alpha and each supported hex form respect explicit zero opacity', async t => {
  const harness = await createControllerHarness();
  t.after(() => harness.cleanup());
  for (const [color, rgb] of [
    ['rgba(0,0,0,0.25)', '0,0,0'],
    ['rgba(12,34,56,0.125)', '12,34,56'],
    ['#abc', '170,187,204'],
    ['#abcd', '170,187,204'],
    ['#aabbcc', '170,187,204'],
    ['#aabbccdd', '170,187,204']
  ]) {
    const popup = await harness.open({ maskColor: color, opacity: 0 });
    const mask = harness.masks()[0];
    assert.equal(mask.style['--mask-enter'], `rgba(${rgb},0)`, color);
    harness.store.close(popup.id);
    await harness.flush();
  }
});
