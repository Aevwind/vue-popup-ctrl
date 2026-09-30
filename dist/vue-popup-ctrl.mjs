import { Fragment as e, Teleport as t, Transition as n, TransitionGroup as r, computed as i, createBlock as a, createCommentVNode as o, createElementBlock as s, createElementVNode as c, createVNode as l, defineComponent as u, inject as d, mergeProps as f, nextTick as p, normalizeClass as m, normalizeStyle as h, onBeforeUnmount as g, onMounted as _, openBlock as v, reactive as y, ref as b, renderList as x, resolveDynamicComponent as S, shallowReactive as C, toDisplayString as w, toHandlers as T, useCssVars as E, watchEffect as D, withCtx as O, withModifiers as k } from "vue";
//#region src/store/storage.ts
function A(e) {
	try {
		return typeof window > "u" ? void 0 : window[e];
	} catch {
		return;
	}
}
function j(e, t = "localStorage") {
	try {
		return A(t)?.getItem(e) ?? null;
	} catch {
		return null;
	}
}
function M(e, t) {
	try {
		let n = A("localStorage");
		t === null ? n?.removeItem(e) : n?.setItem(e, t);
	} catch {}
}
function N() {
	return j("RELEASE", "sessionStorage") || (typeof window > "u" ? "vue-popup-ctrl" : window.location.origin);
}
//#endregion
//#region src/store/popup.ts
function P(e = {}, t, n = /* @__PURE__ */ new WeakMap()) {
	let r = R(e) ? e : {};
	R(t) && n.set(t, r);
	for (let e in t) if (Object.prototype.hasOwnProperty.call(t, e) && e !== "__proto__" && e !== "constructor" && e !== "prototype") {
		let i = t[e];
		if (i === void 0) continue;
		let a = Object.prototype.hasOwnProperty.call(r, e) ? r[e] : void 0;
		r[e] = R(i) ? n.get(i) || P(R(a) ? a : {}, i, n) : Array.isArray(i) ? F(i, n) : i;
	}
	return r;
}
function F(e, t) {
	if (t.has(e)) return t.get(e);
	let n = [];
	return t.set(e, n), e.forEach((e, r) => {
		n[r] = Array.isArray(e) ? F(e, t) : R(e) ? t.get(e) || P({}, e, t) : e;
	}), n;
}
function I(e, t = /* @__PURE__ */ new WeakSet()) {
	return (R(e) || Array.isArray(e)) && !t.has(e) && (t.add(e), Object.values(e).forEach((e) => I(e, t)), Object.freeze(e)), e;
}
function L(...e) {
	let t = {};
	for (let n of e) if (n) for (let e of Object.keys(n)) {
		if (e === "__proto__" || e === "constructor" || e === "prototype") continue;
		let r = n[e];
		r !== void 0 && (t[e] = r);
	}
	return C(t);
}
function R(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
var z = class e {
	static {
		this.deepMerge = P;
	}
	constructor(t, n, r, i, a, o = n) {
		this.show = b(!1), this.ref = b(), this.disabled = !1, this.closing = !1, this.transitionConfig = {}, this.option = {
			type: "",
			maskClose: void 0,
			maskColor: void 0,
			only: !1,
			opacity: void 0,
			zIndex: void 0,
			anime: "bounce",
			maskStyle: {},
			confettiConf: [{
				particleCount: 60,
				spread: 70,
				origin: { y: .6 },
				zIndex: 9999
			}]
		}, this.closeEventDepth = 0, this.closeCtrlFn = (...e) => void 0, this.event = Object.create(null), this.listeners = Object.create(null), this.onRef = (e) => {
			this.ref.value = e ?? void 0;
		}, this.close = (...e) => {
			if (this.closeEventDepth > 0) this.closeCtrlFn.call(this, this.id, ...e);
			else {
				let t = [];
				for (let n of this.event.close?.slice() || []) try {
					let r = n.call(this, ...e);
					r != null && typeof r.then == "function" && t.push(Promise.resolve(r));
				} catch (e) {
					if (!t.length) throw e;
					t.push(Promise.reject(e));
					break;
				}
				if (t.length) return Promise.all(t).then(() => void 0);
			}
		}, this.id = t, this.name = n, this.key = o, this.option = e.deepMerge(this.option, i || {}), this.data = r, this.initTransitionConfig(), this.closeCtrlFn = a;
	}
	initTransitionConfig() {
		let e = this.option.anime, t = {
			enter: 300,
			leave: 300
		};
		e === "boom" ? t.enter = 850 : e === "none" && (t.enter = 0, t.leave = 0), this.transitionConfig = {
			name: e,
			duration: t
		};
	}
	addListener(e, t, n) {
		let r = {
			active: !0,
			source: n,
			handler: (...e) => void 0
		}, i = (...n) => {
			if (r.active) {
				if (e === "close") {
					this.closeEventDepth++;
					try {
						return t(...n);
					} finally {
						this.closeEventDepth--;
					}
				}
				return t(...n);
			}
		};
		return r.handler = i, (this.event[e] ??= []).push(i), (this.listeners[e] ??= []).push(r), () => {
			r.active = !1, this.event[e] = (this.event[e] || []).filter((e) => e !== i), this.listeners[e] = (this.listeners[e] || []).filter((e) => e.handler !== i);
		};
	}
	on(e, t) {
		let n = e;
		return typeof t == "function" ? (e === "close" ? this.addListener(n, (...e) => t.call(this, this.closeCtrlFn.bind(this, this.id), ...e), t) : this.disabled || this.addListener(n, t, t), this) : new Promise((t, r) => {
			let i = !1, a = [], o = this.closeCtrlFn.bind(this, this.id), s = (e) => {
				i || (i = !0, a.forEach((e) => e()), e());
			};
			this.disabled ? s(() => t(void 0)) : e === "close" ? a.push(this.addListener(n, () => {
				s(() => t(o));
			})) : (a.push(this.addListener("close", () => {
				s(() => r(o));
			})), a.push(this.addListener(n, (...e) => {
				s(() => t(e[0]));
			})));
		});
	}
	un(e, t) {
		if (typeof t != "function") return this;
		let n = this.listeners[e], r = n?.findIndex((e) => e.source === t) ?? -1;
		if (r > -1) {
			let t = n[r];
			t.active = !1, this.listeners[e] = n.filter((e) => e !== t), this.event[e] = (this.event[e] || []).filter((e) => e !== t.handler);
		}
		return this;
	}
	props(e) {
		return this.data = C(e), this;
	}
	config(t) {
		return this.option = e.deepMerge(this.option, t || {}), this.initTransitionConfig(), this;
	}
}, B = class {
	constructor(e, t, n = {}, r) {
		this.text = "", this.option = { duration: 3e3 }, this.closeCtrlFn = (...e) => void 0, this.close = () => {
			clearTimeout(this.timer || 0), this.closeCtrlFn(this.id);
		}, this.id = e, this.text = t, this.closeCtrlFn = r, this.option = typeof n == "number" ? z.deepMerge(this.option, { duration: n }) : z.deepMerge(this.option, n || {});
	}
	start() {
		this.timer = setTimeout(() => {
			this.close();
		}, this.option.duration);
	}
}, V = y([]), H = y([]), U = b(1), W = class e {
	get popupConfig() {
		return this.defaults;
	}
	constructor(e, t = {}, n) {
		this.popupIndex = U, this.popupList = V, this.toastList = H, this.defaults = I(z.deepMerge({}, e)), this.caches = t, this.propsToken = n;
	}
	createPopup(e, t, n = {}) {
		return this.createPopupRuntime(e, t, n);
	}
	createPopupRuntime(e, t, n = {}) {
		let r = z.deepMerge({}, this.defaults);
		this.caches.config && (r = z.deepMerge(r, this.caches.config), delete this.caches.config);
		let i = this.propsToken ?? this.caches.props, a = i?.active ? i.data : void 0;
		i && (i.active = !1, this.caches.props === i && delete this.caches.props), n = z.deepMerge(r, n);
		let o = this.popupIndex.value++, s = {}, c = e;
		if (c.indexOf("?") > -1) {
			let t = "";
			[c, t] = String(e).split("?"), t.split("&").forEach((e) => {
				let [t = "", n] = e.split("=");
				s[t] = n || !0;
			});
		}
		if (n?.only) {
			let [t] = this.popupList.filter((t) => t.key === e && !t.closing);
			if (t) return t;
		}
		let l = new z(o, c, L(a, t, s), n, this.close.bind(this), e), u = y(l);
		if (n.type === "daily") {
			let t = `${N()}_${e}_daily_open_time`, n = j(t) || 0, r = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0);
			u.disabled = r <= Number(n), u.on("close", (e, n) => {
				n ? M(t, null) : M(t, r.toString()), u.event.close?.length === 1 && this.close(u.id);
			});
		} else if (n.type === "once") {
			let t = `${N()}_${e}_once`, n = j(t);
			u.disabled = !!Number(n), u.on("close", (e, n) => {
				n ? M(t, null) : M(t, "1"), u.event.close?.length === 1 && this.close(u.id);
			});
		} else u.on("close", () => {
			u.event.close?.length === 1 && this.close(u.id);
		});
		return u.disabled || (this.popupList.push(u), p(() => {
			u.closing || (u.show = !0);
		})), u;
	}
	open(e, t, n = {}) {
		return this.createPopupRuntime(e, t, n);
	}
	only(e, t, n = {}) {
		return this.createPopupRuntime(e, t, z.deepMerge(z.deepMerge({}, n), { only: !0 }));
	}
	daily(e, t, n = {}) {
		return this.createPopupRuntime(e, t, z.deepMerge(z.deepMerge({}, n), { type: "daily" }));
	}
	once(e, t, n = {}) {
		return this.createPopupRuntime(e, t, z.deepMerge(z.deepMerge({}, n), { type: "once" }));
	}
	bottom(e, t, n = {}) {
		return this.createPopupRuntime(e, t, z.deepMerge(z.deepMerge({}, n), { anime: "bottom" }));
	}
	close(e = -1) {
		let t = null;
		if (e === -1) for (let e = this.popupList.length - 1; e >= 0; e--) {
			let n = this.popupList[e];
			if (n && !n.closing) {
				t = n;
				break;
			}
		}
		else t = this.popupList.find((t) => t.id === e) || null;
		if (t && !t.closing) {
			let e = t.id;
			t.closing = !0, t.show = !1, p(() => {
				let t = this.popupList.findIndex((t) => t.id === e);
				t > -1 && this.popupList.splice(t, 1);
			});
		}
		return t;
	}
	toast(e, t) {
		let n = this.popupIndex.value++, r = new B(n, e, t, () => {
			let e = this.toastList.findIndex((e) => e.id === n);
			return e > -1 && this.toastList.splice(e, 1);
		});
		return this.toastList.push(r), r.start(), r;
	}
	props(t) {
		this.caches.props && (this.caches.props.active = !1);
		let n = {
			data: L(t),
			active: !0
		};
		return this.caches.props = n, new e(this.defaults, this.caches, n);
	}
	config(e) {
		return this.caches.config = e, this;
	}
}, G = Object.create(null);
function K(e = {}) {
	let t = z.deepMerge({}, e), n = JSON.stringify(t);
	return G[n] || (G[n] = new W(t)), G[n];
}
//#endregion
//#region src/components/bodyEffects.ts
var q = /* @__PURE__ */ new WeakMap();
function J(e, t, n) {
	if (typeof document > "u" || !document.body) return;
	let r = document.body, i = q.get(r);
	if (t) i || (i = {
		overflow: r.style.getPropertyValue("overflow"),
		priority: r.style.getPropertyPriority("overflow"),
		blurred: r.classList.contains("filter-blur"),
		owners: /* @__PURE__ */ new Map()
	}, q.set(r, i)), i.owners.set(e, n);
	else {
		if (!i) return;
		i.owners.delete(e);
	}
	i.owners.size ? (r.style.setProperty("overflow", "hidden"), r.classList.toggle("filter-blur", i.blurred || [...i.owners.values()].some(Boolean))) : (i.overflow ? r.style.setProperty("overflow", i.overflow, i.priority) : r.style.removeProperty("overflow"), r.classList.toggle("filter-blur", i.blurred), q.delete(r));
}
//#endregion
//#region src/components/maskColor.ts
var Y = (e, t) => {
	let n = typeof e == "string" && e.trim() === "" ? NaN : Number(e);
	return Number.isFinite(n) ? n : t;
}, X = (e, t) => {
	if (/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(e)) {
		let n = e.slice(1), r = n.length <= 4 ? Array.from(n, (e) => e + e).join("") : n, i = [
			0,
			2,
			4
		].map((e) => parseInt(r.slice(e, e + 2), 16)), a = r.length === 8 ? parseInt(r.slice(6), 16) / 255 : 1;
		return `rgba(${i.join(",")},${Y(t, a)})`;
	}
	let n = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)))?\s*\)$/i.exec(e);
	if (n) {
		let e = n[4] == null ? 1 : Number(n[4]);
		return `rgba(${n.slice(1, 4).join(",")},${Y(t, e)})`;
	}
	return e;
}, Z = { class: "popup_ctrl" }, Q = ["onClick"], ee = {
	key: 0,
	class: "popup_ctrl_content"
}, $ = /* @__PURE__ */ u({
	__name: "PopupCtrl",
	props: {
		maskClose: {
			type: Boolean,
			default: !1
		},
		maskColor: {
			type: String,
			default: "#000000"
		},
		bgBlur: {
			type: Boolean,
			default: !1
		},
		opacity: {
			type: Number,
			default: .8
		}
	},
	setup(u) {
		E((e) => ({
			f19944ae: P.value.enter,
			f0dcb4f0: P.value.leave
		}));
		let y = u, A = d("popupStore");
		if (!A) throw Error("[vue-popup-ctrl] 请先使用 app.use(PopupCtrl) 安装插件。");
		let j = b(!1), M = i(() => A.popupList), N = i(() => A.toastList), P = i(() => {
			let e = X(y.maskColor, y.opacity), t = X(y.maskColor, 0);
			return e === t && (t = "transparent"), {
				enter: e,
				leave: t
			};
		}), F = (e, t) => {
			let n = h([e.maskStyle]), r = n && typeof n == "object" ? n : {}, i = r.background || r.backgroundColor || e.maskColor;
			if (i || t != null) {
				let e = String(i || y.maskColor), n = X(e, t ?? y.opacity), r = X(e, 0);
				return n === r && (r = "transparent"), {
					enter: n,
					leave: r
				};
			}
		}, I = Symbol("PopupCtrl"), L = C(/* @__PURE__ */ new Map()), R = !1, z = (e, t) => {
			if (!R) {
				if (t) L.set(e.id, {
					popup: e,
					element: t
				});
				else {
					let t = L.get(e.id)?.element;
					p(() => {
						t && L.get(e.id)?.element === t && !t.isConnected && L.delete(e.id);
					});
				}
			}
		}, B = (e, t) => {
			L.get(e)?.element === t && L.delete(e);
		}, V = ({ popup: e, element: t }) => {
			let n = h(e.option.maskStyle), r = n && typeof n == "object" ? n : {}, i = r["z-index"] ?? r.zIndex ?? e.option.zIndex ?? 99999 + e.id, a = t.ownerDocument?.defaultView?.getComputedStyle(t).zIndex, o = Number(String(a || i).replace(/\s*!important\s*$/i, "").trim());
			return Number.isFinite(o) ? o : 0;
		}, H;
		_(() => {
			j.value = !0, H = D(() => {
				let e = [...L.values()], t, n = -Infinity;
				for (let r of e) {
					let e = V(r), i = !t || !!((t.element.compareDocumentPosition?.(r.element) ?? 4) & 4);
					(e > n || e === n && i) && (t = r, n = e);
				}
				for (let n of e) n.element.classList.toggle("popup_ctrl_mask_top", n === t);
				J(I, e.length > 0, y.bgBlur);
			}, { flush: "post" });
		}), g(() => {
			R = !0, H?.(), L.clear(), J(I, !1, !1);
		});
		let U = (e, t, n, r) => {
			let { option: i } = r;
			n === "boom" && (t === "beforeEnter" ? e.style.backgroundPosition = "center center" : t === "afterEnter" && (e.style.backgroundImage = "")), n === "confetti" && i.confettiConf;
		}, W = (e) => {
			let t = e.option.maskClose;
			if (y.maskClose && typeof t != "boolean" && (t = !0), t) return e.close();
		};
		return (i, u) => j.value ? (v(), a(t, {
			key: 0,
			to: "body"
		}, [c("div", Z, [(v(!0), s(e, null, x(M.value, (e) => (v(), a(n, f({ ref_for: !0 }, e.transitionConfig, {
			key: e.id,
			onBeforeLeave: (t) => z(e, t),
			onAfterLeave: (t) => B(e.id, t),
			onLeaveCancelled: (t) => z(e, t),
			onBeforeEnter: (t) => U(t, "beforeEnter", e.transitionConfig.name || "", e),
			onAfterEnter: (t) => U(t, "afterEnter", e.transitionConfig.name || "", e)
		}), {
			default: O(() => [e.show ? (v(), s("div", {
				class: m(["popup_ctrl_mask", [e.option.anime, e.option.rootClassName]]),
				ref_for: !0,
				ref: (t) => z(e, t),
				onClick: k((t) => W(e), ["stop", "self"]),
				key: e.id,
				style: h([{
					"--mask-enter": F(e.option, e.option.opacity)?.enter,
					"--mask-leave": F(e.option, e.option.opacity)?.leave,
					"--opacity": e.option.opacity,
					zIndex: e.option.zIndex ?? 99999 + e.id
				}, e.option.maskStyle])
			}, [e.name ? (v(), s("div", ee, [(v(), a(S(e.name), f(T(e.event), { ref_for: !0 }, e.data, {
				popupId: e.id,
				ref_for: !0,
				ref: e.onRef
			}), null, 16, ["popupId"]))])) : o("", !0)], 14, Q)) : o("", !0)]),
			_: 2
		}, 1040, [
			"onBeforeLeave",
			"onAfterLeave",
			"onLeaveCancelled",
			"onBeforeEnter",
			"onAfterEnter"
		]))), 128)), l(r, { duration: 300 }, {
			default: O(() => [(v(!0), s(e, null, x(N.value, (e) => (v(), s("span", {
				class: "popup_ctrl_toast",
				key: e.id,
				style: h({ zIndex: 99999 + e.id })
			}, w(e.text), 5))), 128))]),
			_: 1
		})])])) : o("", !0);
	}
}), te = { install(e, t = {}) {
	e.component("PopupCtrl", $), e.provide("popupStore", K(t));
} };
//#endregion
export { $ as PopupCtrl, te as default, K as usePopupStore };
