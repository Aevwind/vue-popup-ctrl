# vue-popup-ctrl

Vue 3 弹窗与 toast 控制插件，支持传递 props、监听事件、遮罩、动画和显示频率限制。

## 安装与接入

需要 Vue 3.5 或更高的 3.x 版本。插件使用项目中的 Vue，不另外打包 Vue。

```sh
npm install vue-popup-ctrl
```

在应用入口安装插件，并手动注册业务弹窗。插件不会自动扫描组件目录。

通过 Vite、Webpack 等支持 CSS 导入的构建工具使用插件或 `PopupCtrl` 组件时，样式会自动引入，无需另外导入 `vue-popup-ctrl/style.css`。原来的手动导入方式仍然兼容。

```ts
// src/main.ts
import { createApp } from 'vue'
import PopupPlugin, { type PopupConfig } from 'vue-popup-ctrl'
import App from './App.vue'
import PopupConfirm from './components/PopupConfirm.vue'

const app = createApp(App)
const options: PopupConfig = { maskClose: true }
app.component('PopupConfirm', PopupConfirm)
app.use(PopupPlugin, options)
app.mount('#app')
```

在应用根组件放置一个控制容器。内部已经使用 Teleport，无需再包一层。

```vue
<!-- src/App.vue -->
<template>
  <main>应用内容</main>
  <PopupCtrl :opacity="0.8" :bg-blur="false" />
</template>
```

默认导出是供 `app.use()` 使用的插件；具名导出 `PopupCtrl` 是控制容器组件。

## 创建与打开弹窗

业务弹窗通过 props 接收数据，通过 emit 触发回调：

```vue
<!-- src/components/PopupConfirm.vue -->
<script setup lang="ts">
defineProps<{ id: number; title?: string }>()
const emit = defineEmits<{
  confirm: [value: { accepted: boolean }]
  close: []
}>()

function confirm() {
  emit('confirm', { accepted: true })
  emit('close')
}
</script>

<template>
  <section class="dialog">
    <h2>{{ title || '确认操作' }}</h2>
    <p>当前编号：{{ id }}</p>
    <button @click="confirm">确认</button>
    <button @click="emit('close')">取消</button>
  </section>
</template>

<style scoped>
.dialog { padding: 24px; border-radius: 12px; background: white; }
</style>
```

在其他组件的 `setup` 中取得 store，在用户交互时打开弹窗：

```vue
<script setup lang="ts">
import { inject } from 'vue'
import type { PopupStore } from 'vue-popup-ctrl'

const popupStore = inject<PopupStore>('popupStore')
if (!popupStore) throw new Error('请先安装 PopupPlugin')
const store = popupStore

function openConfirm() {
  store.open('PopupConfirm', { id: 1, title: '确认提交' })
    .on('confirm', data => console.log(data.accepted))
}
</script>

<template>
  <button @click="openConfirm">打开弹窗</button>
</template>
```

普通模块也可以使用 `usePopupStore()`。所有 store 共享弹窗列表，但各自使用传入的默认配置：`usePopupStore()` 不会自动继承 `app.use()` 的配置。组件内需要这些配置时使用 `inject('popupStore')`。

```ts
import { usePopupStore } from 'vue-popup-ctrl'

const store = usePopupStore({ maskClose: true })
store.open('PopupConfirm', { id: 1 })
```

## 关闭与事件

```ts
const popup = store.open('PopupConfirm', { id: 1 })

popup.close()         // 请求关闭：触发 close 监听，可以被拦截
store.close(popup.id) // 强制关闭指定弹窗，不触发 close 监听
store.close()         // 强制关闭最后一个尚未关闭的弹窗
```

弹窗内部的 `emit('close')` 和允许关闭时的遮罩点击，也会触发 `close` 监听。没有额外监听时自动关闭；注册监听后，由回调决定何时调用第一个参数提供的关闭函数：

```ts
store.open('PopupConfirm', { id: 1 })
  .on('close', close => {
    // 可以先确认或保存数据；不调用 close() 则保留弹窗。
    close()
  })
```

`on(event, callback)` 返回弹窗句柄，支持链式调用。使用同一个函数引用解绑，不影响其他回调或 Promise 监听：

```ts
const popup = store.open('PopupConfirm', { id: 1 })
const handleConfirm = (data: { accepted: boolean }) => console.log(data)
popup.on('confirm', handleConfirm)
popup.un('confirm', handleConfirm)
```

不传回调时返回 Promise，成功值为事件的第一个参数。事件触发前收到关闭请求时，Promise 会拒绝，拒绝值为关闭函数，需要处理取消分支：

```ts
const popup = store.open('PopupConfirm', { id: 1 })
try {
  const data = await popup.on('confirm')
  console.log(data)
} catch (close) {
  if (typeof close === 'function') close()
} finally {
  store.close(popup.id)
}
```

`popup.on('close')` 的成功值也是关闭函数，调用它才会关闭。`store.close()` 绕过所有事件，因此不会完成等待事件的 Promise；需要取消处理时使用 `popup.close()`。

## 配置与方法

单次配置可作为第三个参数传入，或通过句柄修改；`store.config()` 与 `store.props()` 只对下一次创建生效。

```ts
store.open('PopupConfirm', { id: 1 }, { opacity: 0, maskClose: false })
store.config({ anime: 'bottom' }).open('PopupConfirm', { id: 2 })

const popup = store.open('PopupConfirm', { id: 3 })
popup.props({ id: 4 }).config({ maskColor: '#112233', opacity: 0.3 })
```

`PopupConfig` 是类型，需要使用 `import type`。常用字段如下：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `only` | `boolean` | 完整名称相同的弹窗只保留一个 |
| `anime` | `'bounce' \| 'bottom' \| 'none' \| 'boom' \| 'light' \| 'confetti'` | 默认 `bounce`；`none` 关闭动画 |
| `opacity` | `number` | 支持 `0`；未设置时使用容器配置 |
| `zIndex` | `number` | 遮罩层级 |
| `maskClose` | `boolean` | 是否允许点击遮罩请求关闭 |
| `maskColor` | `string` | 遮罩颜色 |
| `maskStyle` | Vue `StyleValue` | 样式对象、CSS 字符串、数组，也可为 `null` 或 `undefined` |
| `rootClassName` | `string` | 遮罩容器附加类名 |
| `type` | `'daily' \| 'once' \| ''` | 显示频率，通常使用同名 store 方法设置 |

`boom`、`light` 和 `confetti` 保留了过渡样式，但当前包不包含爆炸、闪光图片或礼花粒子实现。`confettiConf` 是预留配置，不会播放粒子特效。

控制容器支持 `bgBlur`（默认 `false`）、`maskClose`（默认 `false`）、`maskColor`（默认 `#000000`）和 `opacity`（默认 `0.8`）。模板中使用 `mask-close`，不是 `maskColose`；数字应使用绑定，例如 `:opacity="0.2"`。背景模糊时，`body` 直属元素可加 `dis_popup_blur` 类避免被模糊。

| store 方法 | 行为 |
| --- | --- |
| `open(name, props?, config?)` | 打开弹窗，返回句柄 |
| `bottom(name, props?, config?)` | 使用底部进入动画 |
| `only(name, props?, config?)` | 相同完整名称复用已有弹窗，不更新其数据 |
| `daily(name, props?, config?)` | 按当前浏览器本地日期限制显示 |
| `once(name, props?, config?)` | 按存储命名空间和完整名称限制显示 |
| `close(id?)` | 强制关闭指定弹窗，省略 id 则关闭最后一个 |
| `toast(text, config?)` | 显示提示，配置可为毫秒数或 `{ duration: 3000 }` |
| `props(data)` | 设置下一次创建的 props |
| `config(options)` | 设置下一次创建的配置 |

名称可附带 query，如 `PopupNotice?code=a`。参数作为 props 传给组件，并覆盖第二个参数中的同名字段；query 值保持字符串，无值或空值为 `true`，不会自动转数字或进行 URL 解码。需要数值、对象等类型时使用第二个参数。

`only('PopupNotice?code=a')` 与 `only('PopupNotice?code=b')` 是两个独立弹窗。去重及频率限制按完整字符串区分，不归一化 query 顺序。

`daily` / `once` 在收到弹窗的 `close` 事件时写入 `localStorage` 标记；`store.close()` 绕过事件，因此不会写入标记。`emit('close', true)` 会清除标记。命名空间优先取 `sessionStorage.RELEASE`，否则使用页面 origin。存储被禁用或写入失败时，弹窗仍可使用，但不能保证频率限制。被限制的句柄会设置 `disabled: true`，不会加入显示列表。

句柄还提供 `id`、组件名 `name`、完整名称 `key`、`data`、`option`、`show` 和 `ref`。`ref` 在组件挂载后才能取得；`script setup` 组件需要通过 `defineExpose` 公开要调用的方法。toast 句柄支持 `close()` 提前关闭。

## TypeScript 提示

包内包含 ESM 和 CommonJS 对应的声明，可用于 NodeNext 和 Bundler 解析模式。不声明业务弹窗类型也能调用 API。

如需 props、事件和组件实例提示，在项目中增加声明文件，并确保它被项目的 TypeScript 配置包含：

```ts
// src/popup.d.ts
import 'vue'

declare module 'vue' {
  interface GlobalComponents {
    PopupConfirm: typeof import('./components/PopupConfirm.vue')['default']
  }
}

export {}
```

类型推断读取 Vue 的 `GlobalComponents` 中以 `Popup` 加大写字母开头的名称。类型声明不能代替运行时的 `app.component()` 注册。

## SSR

可以在没有 `window`、`document` 和 Web Storage 的环境中导入包及渲染控制容器。Node 入口不加载 CSS，客户端构建入口会自动关联样式；容器在客户端挂载后才创建 Teleport 和修改页面样式。打开弹窗、toast 等操作应在客户端执行；store 是模块级共享状态，不应保存服务端请求数据，也不提供请求级隔离。

如果直接通过浏览器 `<script>` 加载 `dist/vue-popup-ctrl.umd.js`，没有构建工具处理样式依赖，仍需使用 `<link>` 引入 `dist/vue-popup-ctrl.css`。

## 开发与发布

```sh
npm ci
npm test
npm pack
```

`npm test` 会检查源码类型、构建 JS/CSS 和声明，再运行行为与消费端类型回归。仓库的 `prepack` 会执行这套流程，所以从仓库运行 `npm pack` 或 `npm publish` 时都会重新验证和构建。不要通过 `--ignore-scripts` 跳过检查。参见 [npm 生命周期文档](https://docs.npmjs.com/cli/v11/using-npm/scripts/)。

发布包仅包含 `dist`、README、LICENSE 与 package.json。在独立 Vue 项目安装生成的 `vue-popup-ctrl-1.0.0.tgz`，验证组件、样式与类型后，再进行发布。版本变更后使用相应文件名。

发布前确认 npm 账号具有包名权限，且版本未发布；按 npm 提示完成身份验证。下面最后一条命令会真正上传公开包：

```sh
npm login --registry=https://registry.npmjs.org
npm whoami --registry=https://registry.npmjs.org
npm publish --registry=https://registry.npmjs.org
```

具体账号与发布要求参见 [npm 公共包发布说明](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages/)。项目不会自动登录或发布。

## License

MIT，见 [LICENSE](./LICENSE)。
