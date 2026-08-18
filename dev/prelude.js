// ===== DOM / browser stubs for headless testing (concatenated before game files) =====
const __els = new Map();
function makeEl(id) {
  const el = {
    id: id || '',
    style: { setProperty() {}, removeProperty() {} },
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) { if (force === undefined) { this._set.has(c) ? this._set.delete(c) : this._set.add(c); } else if (force) this._set.add(c); else this._set.delete(c); },
      contains(c) { return this._set.has(c); }
    },
    dataset: {},
    textContent: '',
    innerHTML: '',
    value: '',
    children: [],
    lastChild: null,
    addEventListener() {},
    appendChild() {},
    prepend() {},
    removeChild() {},
    remove() {},
    select() {},
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  return el;
}
const document = {
  getElementById(id) {
    if (!__els.has(id)) __els.set(id, makeEl(id));
    return __els.get(id);
  },
  querySelectorAll() { return []; },
  querySelector() { return null; },
  createElement(tag) { return makeEl(tag); },
  body: makeEl('body'),
  addEventListener() {},
  visibilityState: 'visible',
  title: ''
};
document.body.className = '';
const window = { addEventListener() {} };
const __storage = new Map();
const localStorage = {
  getItem(k) { return __storage.has(k) ? __storage.get(k) : null; },
  setItem(k, v) { __storage.set(k, String(v)); },
  removeItem(k) { __storage.delete(k); }
};
const confirm = () => true;
const location = { reload() {} };
const requestAnimationFrame = (fn) => setTimeout(fn, 0);
const setInterval = () => 0; // game loop driven manually in tests
