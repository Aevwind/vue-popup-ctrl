import { Fragment as e, Teleport as t, Transition as n, TransitionGroup as r, computed as i, createBlock as a, createCommentVNode as o, createElementBlock as s, createElementVNode as c, createVNode as l, defineComponent as u, inject as d, mergeProps as f, nextTick as p, normalizeClass as m, normalizeStyle as h, onBeforeUnmount as g, onMounted as _, openBlock as v, reactive as y, ref as b, renderList as x, resolveDynamicComponent as S, shallowReactive as C, toDisplayString as w, toHandlers as T, useCssVars as E, watch as D, withCtx as O, withModifiers as k } from "vue";
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
function P(e = {}, t) {
	let n = I(e) ? e : {};
	for (let e in t) if (Object.prototype.hasOwnProperty.call(t, e) && e !== "__proto__" && e !== "constructor" && e !== "prototype") {
		let r = t[e];
		if (r === void 0) continue;
		let i = Object.prototype.hasOwnProperty.call(n, e) ? n[e] : void 0;
		n[e] = I(r) ? P(I(i) ? i : {}, r) : r;
	}
	return n;
}
function F(...e) {
	let t = {};
	for (let n of e) if (n) for (let e of Object.keys(n)) {
		if (e === "__proto__" || e === "constructor" || e === "prototype") continue;
		let r = n[e];
		r !== void 0 && (t[e] = r);
	}
	return C(t);
}
function I(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
var L = class e {
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
			this.ref.value = e;
		}, this.close = (...e) => {
			this.closeEventDepth > 0 ? this.closeCtrlFn.call(this, this.id, ...e) : this.event.close?.slice().forEach((t) => {
				t.call(this, ...e);
			});
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
		let r = e === "close" ? (...e) => {
			this.closeEventDepth++;
			try {
				return t(...e);
			} finally {
				this.closeEventDepth--;
			}
		} : t;
		return (this.event[e] ??= []).push(r), (this.listeners[e] ??= []).push({
			source: n,
			handler: r
		}), () => {
			this.event[e] = (this.event[e] || []).filter((e) => e !== r), this.listeners[e] = (this.listeners[e] || []).filter((e) => e.handler !== r);
		};
	}
	on(e, t) {
		let n = e;
		return typeof t == "function" ? (e === "close" ? this.addListener(n, (...e) => {
			t.call(this, this.closeCtrlFn.bind(this, this.id), ...e);
		}, t) : (this.addListener(n, t, t), this.disabled && t?.()), this) : new Promise((t, r) => {
			let i = !1, a = [], o = this.closeCtrlFn.bind(this, this.id), s = (e) => {
				i || (i = !0, a.forEach((e) => e()), e());
			};
			e === "close" ? a.push(this.addListener(n, () => {
				s(() => t(o));
			})) : this.disabled ? s(() => t(void 0)) : (a.push(this.addListener("close", () => {
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
			let [t] = n.splice(r, 1), i = this.event[e]?.indexOf(t.handler) ?? -1;
			i > -1 && this.event[e].splice(i, 1);
		}
		return this;
	}
	props(e) {
		return this.data = C(e), this;
	}
	config(t) {
		return this.option = e.deepMerge(this.option, t || {}), this.initTransitionConfig(), this;
	}
}, R = class {
	constructor(e, t, n = {}, r) {
		this.text = "", this.option = { duration: 3e3 }, this.closeCtrlFn = (...e) => void 0, this.close = () => {
			clearTimeout(this.timer || 0), this.closeCtrlFn(this.id);
		}, this.id = e, this.text = t, this.closeCtrlFn = r, this.option = typeof n == "number" ? L.deepMerge(this.option, { duration: n }) : L.deepMerge(this.option, n || {});
	}
	start() {
		this.timer = setTimeout(() => {
			this.close();
		}, this.option.duration);
	}
};
function z() {
	let e = y([]), t = y([]), n = b(1);
	class r {
		constructor(r) {
			this.popupConfig = {}, this.popupIndex = n, this.popupList = e, this.toastList = t, this.dataCache = null, this.configCache = null, this.popupConfig = r;
		}
		createPopup(e, t, n = {}) {
			let r = L.deepMerge({}, this.popupConfig);
			this.configCache &&= (r = L.deepMerge(r, this.configCache), null);
			let i = this.dataCache;
			this.dataCache = null, n = L.deepMerge(r, n);
			let a = this.popupIndex.value++, o = {}, s = e;
			if (s.indexOf("?") > -1) {
				let t = "";
				[s, t] = String(e).split("?"), t.split("&").forEach((e) => {
					let [t = "", n] = e.split("=");
					o[t] = n || !0;
				});
			}
			if (n?.only) {
				let [t] = this.popupList.filter((t) => t.key === e && !t.closing);
				if (t) return t;
			}
			let c = new L(a, s, F(i, t, o), n, this.close.bind(this), e), l = y(c);
			if (n.type === "daily") {
				let t = `${N()}_${e}_daily_open_time`, n = j(t) || 0, r = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0);
				l.disabled = r <= Number(n), l.on("close", (e, n) => {
					n ? M(t, null) : M(t, r.toString()), l.event.close?.length === 1 && this.close(l.id);
				});
			} else if (n.type === "once") {
				let t = `${N()}_${e}_once`, n = j(t);
				l.disabled = !!Number(n), l.on("close", (e, n) => {
					n ? M(t, null) : M(t, "1"), l.event.close?.length === 1 && this.close(l.id);
				});
			} else l.on("close", () => {
				l.event.close?.length === 1 && this.close(l.id);
			});
			return l.disabled || (this.popupList.push(l), p(() => {
				l.closing || (l.show = !0);
			})), l;
		}
		open(e, t, n = {}) {
			return this.createPopup(e, t, n);
		}
		only(e, t, n = {}) {
			return this.createPopup(e, t, L.deepMerge(n, { only: !0 }));
		}
		daily(e, t, n = {}) {
			return this.createPopup(e, t, L.deepMerge(n, { type: "daily" }));
		}
		once(e, t, n = {}) {
			return this.createPopup(e, t, L.deepMerge(n, { type: "once" }));
		}
		bottom(e, t, n = {}) {
			return this.createPopup(e, t, Object.assign(n, { anime: "bottom" }));
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
			let n = this.popupIndex.value++, r = new R(n, e, t, () => {
				let e = this.toastList.findIndex((e) => e.id === n);
				return e > -1 && this.toastList.splice(e, 1);
			});
			return this.toastList.push(r), r.start(), r;
		}
		props(e) {
			return this.dataCache = e, this;
		}
		config(e) {
			return this.configCache = e, this;
		}
	}
	let i = Object.create(null);
	function a(e = {}) {
		let t = JSON.stringify(e);
		return i[t] || (i[t] = new r(e)), i[t];
	}
	return a;
}
var B = z(), V = /* @__PURE__ */ new WeakMap();
function H(e, t, n) {
	if (typeof document > "u" || !document.body) return;
	let r = document.body, i = V.get(r);
	if (t) i || (i = {
		overflow: r.style.getPropertyValue("overflow"),
		priority: r.style.getPropertyPriority("overflow"),
		blurred: r.classList.contains("filter-blur"),
		owners: /* @__PURE__ */ new Map()
	}, V.set(r, i)), i.owners.set(e, n);
	else {
		if (!i) return;
		i.owners.delete(e);
	}
	i.owners.size ? (r.style.setProperty("overflow", "hidden"), r.classList.toggle("filter-blur", i.blurred || [...i.owners.values()].some(Boolean))) : (i.overflow ? r.style.setProperty("overflow", i.overflow, i.priority) : r.style.removeProperty("overflow"), r.classList.toggle("filter-blur", i.blurred), V.delete(r));
}
//#endregion
//#region src/components/PopupCtrl.vue?vue&type=script&setup=true&lang.ts
var U = { class: "popup_ctrl" }, W = ["onClick"], G = {
	key: 0,
	class: "popup_ctrl_content"
}, K = /* @__PURE__ */ u({
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
			v3215b2ee: N.value.enter,
			v3273facd: N.value.leave
		}));
		let p = u, y = d("popupStore");
		if (!y) throw Error("[vue-popup-ctrl] 请先使用 app.use(PopupCtrl) 安装插件。");
		let C = b(!1), A = i(() => y.popupList), j = i(() => y.toastList), M = (e, t) => {
			let n = /^#([0-9a-fA-f]{3,8})$/, r = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,?\s*([\.0-9]{1,3})?\s*\)$/;
			if (n.test(e)) {
				let n = e.slice(1), r = n.length === 3 || n.length === 4, i = n.match(r ? /.{1}/g : /.{2}/g)?.map((e, t) => {
					let n = e;
					return r && (n += e), t === 3 ? parseInt(n, 16) / 255 : parseInt(n, 16);
				}) || [];
				return t = isNaN(Number(t)) && i.join(",")[3] || t, `rgba(${i.slice(0, 3).join(",")},${t})`;
			}
			return r.test(e) ? e.replace(r, (e, n, r, i, a) => a ? `rgba(${n},${r},${i},${isNaN(Number(t)) ? a : t})` : `rgba(${n},${r},${i},${t})`) : e;
		}, N = i(() => {
			let e = M(p.maskColor, p.opacity), t = M(p.maskColor, 0);
			return e === t && (t = "transparent"), {
				enter: e,
				leave: t
			};
		}), P = (e, t) => {
			let n = h([e.maskStyle]), r = n && typeof n == "object" ? n : {}, i = r.background || r.backgroundColor || e.maskColor;
			if (i || t != null) {
				let e = String(i || p.maskColor), n = M(e, t ?? p.opacity), r = M(e, 0);
				return n === r && (r = "transparent"), {
					enter: n,
					leave: r
				};
			}
		}, F = Symbol("PopupCtrl"), I;
		_(() => {
			C.value = !0, I = D([() => A.value.length, () => p.bgBlur], ([e, t]) => H(F, e > 0, t), {
				immediate: !0,
				flush: "post"
			});
		}), g(() => {
			I?.(), H(F, !1, !1);
		});
		let L = (e, t, n, r) => {
			let { option: i } = r;
			n === "boom" && (t === "beforeEnter" ? e.style.backgroundPosition = "center center" : t === "afterEnter" && (e.style.backgroundImage = "")), n === "confetti" && i.confettiConf;
		}, R = (e) => {
			let t = e.option.maskClose;
			p.maskClose && typeof t != "boolean" && (t = !0), t && e.close();
		};
		return (i, u) => C.value ? (v(), a(t, {
			key: 0,
			to: "body"
		}, [c("div", U, [(v(!0), s(e, null, x(A.value, (e) => (v(), a(n, f({ ref_for: !0 }, e.transitionConfig, {
			key: e.id,
			onBeforeEnter: (t) => L(t, "beforeEnter", e.transitionConfig.name || "", e),
			onAfterEnter: (t) => L(t, "afterEnter", e.transitionConfig.name || "", e)
		}), {
			default: O(() => [e.show ? (v(), s("div", {
				class: m(["popup_ctrl_mask", [e.option.anime, e.option.rootClassName]]),
				onClick: k((t) => R(e), ["stop", "self"]),
				key: e.id,
				style: h([{
					"--mask-enter": P(e.option, e.option.opacity)?.enter,
					"--mask-leave": P(e.option, e.option.opacity)?.leave,
					"--opacity": e.option.opacity,
					zIndex: e.option.zIndex ?? 99999 + e.id
				}, e.option.maskStyle])
			}, [e.name ? (v(), s("div", G, [(v(), a(S(e.name), f(T(e.event), { ref_for: !0 }, e.data, {
				popupId: e.id,
				ref_for: !0,
				ref: e.onRef
			}), null, 16, ["popupId"]))])) : o("", !0)], 14, W)) : o("", !0)]),
			_: 2
		}, 1040, ["onBeforeEnter", "onAfterEnter"]))), 128)), l(r, { duration: 300 }, {
			default: O(() => [(v(!0), s(e, null, x(j.value, (e) => (v(), s("span", {
				class: "popup_ctrl_toast",
				key: e.id,
				style: h({ zIndex: 99999 + e.id })
			}, w(e.text), 5))), 128))]),
			_: 1
		})])])) : o("", !0);
	}
}), q = { install(e, t = {}) {
	e.component("PopupCtrl", K), e.provide("popupStore", B(t));
} };
//#endregion
export { K as PopupCtrl, q as default, B as usePopupStore };
