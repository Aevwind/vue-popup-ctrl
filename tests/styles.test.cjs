const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');

for (const [label, page] of [
  ['default plugin', 'index.html'],
  ['named component', 'named.html'],
  ['CommonJS browser entry', 'common.html']
]) {
  test(`${label} includes popup styles without a CSS import in the app`, async () => {
    const { build } = await import('vite');
    const root = resolve(__dirname, 'fixtures/styles');
    const result = await build({
      root,
      configFile: false,
      logLevel: 'silent',
      build: { write: false, rolldownOptions: { input: resolve(root, page) } }
    });
    const output = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
    const css = output.filter(file => file.type === 'asset' && file.fileName.endsWith('.css'))
      .map(file => String(file.source)).join('\n');
    const html = output.find(file => file.type === 'asset' && file.fileName.endsWith('.html'));
    assert.match(css, /\.popup_ctrl_mask/);
    assert.match(css, /\.popup_ctrl_toast/);
    assert.match(String(html?.source), /<link[^>]+rel="stylesheet"/);
  });
}
