import { Fragment as e, Teleport as t, Transition as n, TransitionGroup as r, computed as i, createBlock as a, createCommentVNode as o, createElementBlock as s, createElementVNode as c, createVNode as l, defineComponent as u, inject as d, mergeProps as f, nextTick as p, normalizeClass as m, normalizeStyle as h, openBlock as g, reactive as _, ref as v, renderList as y, resolveDynamicComponent as b, toDisplayString as x, toHandlers as S, useCssVars as C, watch as w, withCtx as T, withModifiers as E } from "vue";
//#region src/store/popup.ts
var D = sessionStorage.getItem("RELEASE") || location.pathname.match(/\/([^\/]+)\/(?:index\.html)$/)?.[1] || "actName";
function O(e = {}, t) {
	let n = e;
	for (let e in t) if (Object.prototype.hasOwnProperty.call(t, e)) {
		let r = t[e], i = n[e];
		k(r) ? (k(i) || (n[e] = {}), n[e] = O(n[e], r)) : n[e] = r;
	}
	return n;
}
function k(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var A = class e {
	static deepMerge = O;
	show = v(!1);
	id;
	name;
	data;
	ref = v();
	disabled = !1;
	closing = !1;
	transitionConfig = {};
	option = {
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
	};
	selfCloseIndex = -1;
	closeCtrlFn = (...e) => void 0;
	event = {};
	eventSource = {};
	constructor(t, n, r, i, a) {
		this.id = t, this.name = n, this.option = e.deepMerge(this.option, i || {}), this.data = r, this.initTransitionConfig(), this.closeCtrlFn = a;
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
	on(e, t) {
		this.event[e] || (this.event[e] = []), this.eventSource[e] || (this.eventSource[e] = []);
		let n = this.eventSource[e]?.length || -1;
		if (typeof t != "function") {
			let t = null, r = null;
			return new Promise((i, a) => {
				if (t = i, r = a, e === "close") this.event[e]?.push(() => {
					this.selfCloseIndex = n, t();
				});
				else {
					let i = !1;
					this.event.close?.push(() => {
						this.selfCloseIndex = n, i ? this.closeCtrlFn.call(this, this.id) : (i = !0, r(this.closeCtrlFn.bind(this, this.id)));
					}), this.event[e]?.push((...e) => {
						i = !0, t(...e);
					}), this.disabled && (i = !0, t());
				}
			});
		}
		return e === "close" ? this.event[e]?.push((...e) => {
			this.selfCloseIndex = n, t.call(this, this.closeCtrlFn.bind(this, this.id), ...e);
		}) : (this.event[e]?.push(t), this.disabled && t?.()), this.eventSource[e]?.push(t), this;
	}
	un(e, t) {
		let n = this.eventSource[e]?.indexOf(t) ?? -1;
		return n > -1 && (this.event[e]?.splice(n, 1), this.eventSource[e]?.splice(n, 1)), this;
	}
	onRef = (e) => (this.ref.value = e, this);
	close = (...e) => {
		this.selfCloseIndex > -1 ? this.closeCtrlFn.call(this, this.id, ...e) : this.event.close?.forEach((t) => {
			t.call(this, ...e);
		});
	};
	props(e) {
		return this.data = e, this;
	}
	config(t) {
		return this.option = e.deepMerge(this.option, t || {}), this.initTransitionConfig(), this;
	}
}, j = class {
	id;
	text = "";
	option = { duration: 3e3 };
	timer = 0;
	closeCtrlFn = (...e) => void 0;
	constructor(e, t, n = {}, r) {
		this.id = e, this.text = t, this.closeCtrlFn = r, this.option = typeof n == "number" ? A.deepMerge(this.option, { duration: n }) : A.deepMerge(this.option, n || {});
	}
	close = () => {
		clearTimeout(this.timer || 0), this.closeCtrlFn(this.id);
	};
	start() {
		this.timer = setTimeout(() => {
			this.close();
		}, this.option.duration);
	}
};
function M() {
	let e = _([]), t = _([]), n = v(1);
	class r {
		popupConfig = {};
		popupIndex = n;
		popupList = e;
		toastList = t;
		currentCloseId = v(-1);
		dataCache = null;
		configCache = null;
		constructor(e) {
			this.popupConfig = e;
		}
		createPopup(e, t, n = {}) {
			let r = A.deepMerge({}, this.popupConfig);
			this.configCache &&= (r = A.deepMerge(r, this.configCache), null), this.dataCache &&= (t = A.deepMerge(this.dataCache, t || {}), null), n = A.deepMerge(r, n);
			let i = this.popupIndex.value++, a = {}, o = e;
			if (o.indexOf("?") > -1) {
				let t = "";
				[o, t] = String(e).split("?"), t.split("&").forEach((e) => {
					let [t = "", n] = e.split("=");
					a[t] = n || !0;
				});
			}
			if (n?.only) {
				let [e] = this.popupList.filter((e) => e.name === o && !e.closing);
				if (e) return e;
			}
			let s = new A(i, o, A.deepMerge(t, a), n, this.close.bind(this)), c = _(s);
			if (n.type === "daily") {
				let t = `${D}_${e}_daily_open_time`, n = localStorage.getItem(t) || 0, r = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0);
				c.disabled = r <= Number(n), c.on("close", (e, n) => {
					this.currentCloseId.value = c.id, n ? localStorage.removeItem(t) : localStorage.setItem(t, r.toString()), c.event.close?.length === 1 && this.close(c.id);
				});
			} else if (n.type === "once") {
				let t = `${D}_${e}_once`, n = localStorage.getItem(t);
				c.disabled = !!Number(n), c.on("close", (e, n) => {
					this.currentCloseId.value = c.id, n ? localStorage.removeItem(t) : localStorage.setItem(t, "1"), c.event.close?.length === 1 && this.close(c.id);
				});
			} else c.on("close", () => {
				this.currentCloseId.value = c.id, c.event.close?.length === 1 && this.close(c.id);
			});
			return c.disabled || (this.popupList.push(c), p(() => {
				c.closing || (c.show = !0);
			})), c;
		}
		open(e, t, n = {}) {
			return this.createPopup(e, t, n);
		}
		only(e, t, n = {}) {
			return this.createPopup(e, t, A.deepMerge(n, { only: !0 }));
		}
		daily(e, t, n = {}) {
			return this.createPopup(e, t, A.deepMerge(n, { type: "daily" }));
		}
		once(e, t, n = {}) {
			return this.createPopup(e, t, A.deepMerge(n, { type: "once" }));
		}
		bottom(e, t, n = {}) {
			return this.createPopup(e, t, Object.assign(n, { anime: "bottom" }));
		}
		close(e = this.currentCloseId.value) {
			let t = null;
			if (e === -1) {
				for (let e = this.popupList.length - 1; e >= 0; e--) {
					let n = this.popupList[e];
					if (n && !n.closing) {
						t = n;
						break;
					}
				}
				t && t.close();
			} else {
				let n = this.popupList.findIndex((t) => t.id === e);
				n > -1 && (t = this.popupList[n] || null, t && !t.closing && (t.closing = !0, t.show = !1, p(() => {
					let t = this.popupList.findIndex((t) => t.id === e);
					t > -1 && this.popupList.splice(t, 1);
				})));
			}
			return this.currentCloseId.value = -1, t;
		}
		toast(e, t) {
			let n = this.popupIndex.value++, r = new j(n, e, t, () => {
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
	let i = {};
	function a(e = {}) {
		let t = JSON.stringify(e);
		return i[t] || (i[t] = new r(e)), i[t];
	}
	return a;
}
var N = M(), P = { class: "popup_ctrl" }, F = ["onClick"], I = {
	key: 0,
	class: "popup_ctrl_content"
}, L = /* @__PURE__ */ u({
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
		C((e) => ({
			v43929892: k.value.enter,
			v42d608d4: k.value.leave
		}));
		let p = u, _ = d("popupStore"), v = i(() => _.popupList), D = i(() => _.toastList), O = (e, t) => {
			let n = /^#([0-9a-fA-f]{3,8})$/, r = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,?\s*([\.0-9]{1,3})?\s*\)$/;
			if (n.test(e)) {
				let n = e.slice(1), r = n.length === 3 || n.length === 4, i = n.match(r ? /.{1}/g : /.{2}/g)?.map((e, t) => {
					let n = e;
					return r && (n += e), t === 3 ? parseInt(n, 16) / 255 : parseInt(n, 16);
				}) || [];
				return t = isNaN(Number(t)) && i.join(",")[3] || t, `rgba(${i.slice(0, 3).join(",")},${t})`;
			}
			return r.test(e) ? e.replace(r, (e, n, r, i, a) => a ? `rgba(${n},${r},${i},${isNaN(Number(t)) ? a : t})` : `rgba(${n},${r},${i},${t})`) : e;
		}, k = i(() => {
			let e = O(p.maskColor, p.opacity), t = O(p.maskColor, 0);
			return e === t && (t = "transparent"), {
				enter: e,
				leave: t
			};
		}), A = (e, t) => {
			let n = e.maskStyle.background || e.maskStyle.backgroundColor || e.maskColor;
			if (n || t) {
				let e = O(n || p.maskColor, t ?? p.opacity), r = O(n || p.maskColor, 0);
				return e === r && (r = "transparent"), {
					enter: e,
					leave: r
				};
			}
		};
		w(v, (e) => {
			e.length ? (document.body.style.overflow = "hidden", p.bgBlur && document.body.classList.add("filter-blur")) : (document.body.style.overflow = "", p.bgBlur && document.body.classList.remove("filter-blur"));
		}, {
			immediate: !0,
			deep: !0
		});
		let j = (e, t, n, r) => {
			let { option: i } = r;
			n === "boom" && (t === "beforeEnter" ? e.style.backgroundPosition = "center center" : t === "afterEnter" && (e.style.backgroundImage = "")), n === "confetti" && i.confettiConf;
		}, M = (e) => {
			let t = e.option.maskClose;
			p.maskClose && typeof t != "boolean" && (t = !0), t && (e.selfCloseIndex = -1, e.close());
		};
		return (i, u) => (g(), a(t, { to: "body" }, [c("div", P, [(g(!0), s(e, null, y(v.value, (e) => (g(), a(n, f({ ref_for: !0 }, e.transitionConfig, {
			key: e.id,
			onBeforeEnter: (t) => j(t, "beforeEnter", e.transitionConfig.name || "", e),
			onAfterEnter: (t) => j(t, "afterEnter", e.transitionConfig.name || "", e)
		}), {
			default: T(() => [e.show ? (g(), s("div", {
				class: m(["popup_ctrl_mask", [e.option.anime, e.option.rootClassName]]),
				onClick: E((t) => M(e), ["stop", "self"]),
				key: e.id,
				style: h([{
					"--mask-enter": A(e.option, e.option.opacity)?.enter,
					"--mask-leave": A(e.option, e.option.opacity)?.leave,
					"--opacity": e.option.opacity,
					zIndex: e.option.zIndex || 99999 + e.id
				}, e.option.maskStyle])
			}, [e.name ? (g(), s("div", I, [(g(), a(b(e.name), f(S(e.event), { ref_for: !0 }, e.data, {
				popupId: e.id,
				ref_for: !0,
				ref: e.onRef
			}), null, 16, ["popupId"]))])) : o("", !0)], 14, F)) : o("", !0)]),
			_: 2
		}, 1040, ["onBeforeEnter", "onAfterEnter"]))), 128)), l(r, { duration: 300 }, {
			default: T(() => [(g(!0), s(e, null, y(D.value, (e) => (g(), s("span", {
				class: "popup_ctrl_toast",
				key: e.id,
				style: h({ zIndex: 99999 + e.id })
			}, x(e.text), 5))), 128))]),
			_: 1
		})])]));
	}
}), R = { install(e, t = {}) {
	e.component("PopupCtrl", L), e.provide("popupStore", N(t));
} };
//#endregion
export { R as default, N as usePopupStore };
