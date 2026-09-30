const { createRenderer, h, nextTick } = require('vue');
const library = require('vue-popup-ctrl');

// Exercise the built controller and Vue transitions without an external DOM package.
const createNode = (tag, nodeType = 1, text = '') => {
  const node = { tag, nodeType, text, children: [], parentNode: null, className: '', props: {}, ownerDocument: global.document };
  Object.defineProperty(node, 'isConnected', {
    get() {
      let root = node;
      while (root.parentNode) root = root.parentNode;
      return root.tag === 'body';
    }
  });
  const priorities = new Map();
  node.style = {
    setProperty(name, value, priority = '') {
      this[name] = String(value);
      priorities.set(name, priority);
    },
    getPropertyValue(name) { return this[name] || ''; },
    getPropertyPriority(name) { return priorities.get(name) || ''; },
    removeProperty(name) {
      const previous = this[name] || '';
      delete this[name];
      priorities.delete(name);
      return previous;
    }
  };
  node.classList = {
    contains(name) { return node.className.split(/\s+/).includes(name); },
    add(...names) {
      node.className = [...new Set([...node.className.split(/\s+/).filter(Boolean), ...names])].join(' ');
    },
    remove(...names) { node.className = node.className.split(/\s+/).filter(name => !names.includes(name)).join(' '); },
    toggle(name, force) {
      const active = force ?? !this.contains(name);
      if (active) this.add(name);
      else this.remove(name);
      return active;
    }
  };
  return node;
};

const remove = node => {
  const parent = node.parentNode;
  if (parent) parent.children.splice(parent.children.indexOf(node), 1);
  node.parentNode = null;
};

const descendants = node => node.children.flatMap(child => [child, ...descendants(child)]);

async function createControllerHarness(props = {}) {
  const store = library.usePopupStore();
  for (const popup of [...store.popupList]) store.close(popup.id);
  for (const toast of [...store.toastList]) toast.close();
  await nextTick();

  const body = createNode('body');
  body.style.setProperty('overflow', 'scroll', 'important');
  const previousDocument = Object.getOwnPropertyDescriptor(global, 'document');
  global.document = {
    body,
    defaultView: {
      getComputedStyle(node) {
        return { zIndex: String(node.style['z-index'] ?? node.style.zIndex ?? 'auto') };
      }
    }
  };
  const renderer = createRenderer({
    createElement: tag => createNode(tag),
    createText: text => createNode('#text', 3, text),
    createComment: text => createNode('#comment', 8, text),
    setText: (node, text) => { node.text = text; },
    setElementText: (node, text) => { node.text = text; },
    parentNode: node => node.parentNode,
    nextSibling: node => {
      const children = node.parentNode?.children || [];
      return children[children.indexOf(node) + 1] || null;
    },
    insert(node, parent, anchor = null) {
      remove(node);
      const index = anchor ? parent.children.indexOf(anchor) : -1;
      parent.children.splice(index < 0 ? parent.children.length : index, 0, node);
      node.parentNode = parent;
    },
    remove,
    querySelector: selector => selector === 'body' ? body : null,
    patchProp(node, key, previous, value) {
      node.props[key] = value;
      if (key === 'class') node.className = value || '';
      if (key === 'style') {
        for (const name of Object.keys(previous || {})) {
          if (!value || !Object.hasOwn(value, name)) node.style.removeProperty(name);
        }
        for (const [name, property] of Object.entries(value || {})) node.style.setProperty(name, property);
      }
    }
  });
  const app = renderer.createApp({ render: () => h(library.PopupCtrl, props) });
  app.provide('popupStore', store);
  app.component('PopupFixture', { render: () => h('section', 'Popup content') });
  app.mount(createNode('app'));

  const flush = async () => {
    // Opening and closing also queue their own nextTick callbacks.
    await nextTick();
    await nextTick();
    await nextTick();
  };
  await flush();
  let unmounted = false;
  return {
    body,
    store,
    flush,
    masks: () => descendants(body).filter(node => node.classList.contains('popup_ctrl_mask')),
    async open(config = {}, onLeave) {
      const popup = store.open('PopupFixture', {}, config);
      popup.transitionConfig = { css: false, ...(onLeave ? { onLeave } : {}) };
      await flush();
      return popup;
    },
    unmount() {
      if (!unmounted) app.unmount();
      unmounted = true;
    },
    async cleanup() {
      this.unmount();
      for (const popup of [...store.popupList]) store.close(popup.id);
      for (const toast of [...store.toastList]) toast.close();
      await flush();
      if (previousDocument) Object.defineProperty(global, 'document', previousDocument);
      else delete global.document;
    }
  };
}

module.exports = { createControllerHarness };
