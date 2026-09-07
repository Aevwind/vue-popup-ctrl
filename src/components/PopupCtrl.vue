<!-- 弹窗控制 -->
<template>
  <Teleport v-if="mounted" to="body">
    <div class="popup_ctrl">
      <!-- <PopupItem v-for="item in popupList" :key="item.name" :popupItem="item"></PopupItem> -->
      <Transition
        v-bind="popupItem.transitionConfig"
        v-for="popupItem in popupList"
        :key="popupItem.id"
        @beforeEnter="animeEvent($event, 'beforeEnter', popupItem.transitionConfig.name || '', popupItem)"
        @afterEnter="animeEvent($event, 'afterEnter', popupItem.transitionConfig.name || '', popupItem)"
      >
        <div
          class="popup_ctrl_mask"
          @click.stop.self="clickMask(popupItem)"
          :key="popupItem.id"
          :style="[
            {
              '--mask-enter': setMaskColor(popupItem.option, popupItem.option.opacity)?.enter,
              '--mask-leave': setMaskColor(popupItem.option, popupItem.option.opacity)?.leave,
              '--opacity': popupItem.option.opacity,
              zIndex: popupItem.option.zIndex ?? 99999 + popupItem.id,
            },
            popupItem.option.maskStyle,
          ]"
          :class="[popupItem.option.anime, popupItem.option.rootClassName]"
          v-if="popupItem.show"
        >
          <div class="popup_ctrl_content" v-if="popupItem.name">
            <Component v-on="popupItem.event" v-bind="popupItem.data" :is="popupItem.name" :popupId="popupItem.id" :ref="popupItem.onRef"></Component>
          </div>
        </div>
      </Transition>
      <transition-group :duration="300">
        <span class="popup_ctrl_toast" v-for="item in toastList" :key="item.id" :style="{ zIndex: 99999 + item.id }">{{ item.text }}</span>
      </transition-group>
    </div>
  </Teleport>
</template>
<script lang="ts" setup>
import { computed, watch, inject, ref, onMounted, onBeforeUnmount, normalizeStyle, Transition, TransitionGroup } from 'vue'
import type { PopupConfig, PopupStore } from '../store/popup.js'
import { updateBodyEffects } from './bodyEffects.js'
// import { ORIGIN } from 'UTIL/index'
// import confetti from 'canvas-confetti'

const $props = defineProps({
  // 點擊遮罩關閉
  maskClose: {
    type: Boolean,
    default: false,
  },
  maskColor: {
    type: String,
    default: '#000000',
  },
  /** 開啟背景模糊, body下元素添加dis_popup_blur類名可不模糊 */
  bgBlur: {
    type: Boolean,
    default: false,
  },
  /** 背景透明度 */
  opacity: {
    type: Number,
    default: 0.8,
  },
})

const popupStore = inject<PopupStore>('popupStore')
if (!popupStore) throw new Error('[vue-popup-ctrl] 请先使用 app.use(PopupCtrl) 安装插件。')
const mounted = ref(false)
// 弹窗列表
const popupList = computed(() => {
  // (window as any).popupStore = popupStore;
  return popupStore.popupList
})
// toast列表
const toastList = computed(() => popupStore.toastList)

const toRgba = (color: string, opacity: number|string) => {
  const hexColorReg = /^#([0-9a-fA-f]{3,8})$/
  const rgbColorReg = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,?\s*([\.0-9]{1,3})?\s*\)$/
  if (hexColorReg.test(color)) {
    const hexStr = color.slice(1);
    const singlehex = hexStr.length === 3 || hexStr.length === 4

    const rgbList = hexStr.match(singlehex ? /.{1}/g : /.{2}/g)?.map((item, i) => {
      let hexItem = item
      if (singlehex) {
        hexItem += item
      }
      if (i === 3) {
        return parseInt(hexItem, 16) / 255
      }
      return parseInt(hexItem, 16)
    }) || [];
    opacity = isNaN(Number(opacity)) ? rgbList.join(',')[3] || opacity : opacity
    return `rgba(${rgbList.slice(0, 3).join(',')},${opacity})`
  } else if (rgbColorReg.test(color)) {
    const rgba = color.replace(rgbColorReg, (_, r, g, b, a) => {
      if (a) {
        return `rgba(${r},${g},${b},${isNaN(Number(opacity)) ? a : opacity})`
      }
      return `rgba(${r},${g},${b},${opacity})`
    })
    return rgba
  } else {
    return color
  }
}

const defaultMaskColor = computed(() => {
  const enter = toRgba($props.maskColor, $props.opacity)
  let leave = toRgba($props.maskColor, 0)
  if (enter === leave) {
    leave = 'transparent'
  }
  return {
    enter,
    leave,
  }
})

// 設置遮罩顏色
const setMaskColor = (option: PopupConfig, opacity: number | string | undefined) => {
  const normalized = normalizeStyle([option.maskStyle])
  const style = normalized && typeof normalized === 'object' ? normalized : {}
  const background = style.background || style.backgroundColor || option.maskColor
  if (background || opacity != null) {
    const color = String(background || $props.maskColor)
    const enter = toRgba(color, opacity ?? $props.opacity)
    let leave = toRgba(color, 0)
    if (enter === leave) {
      leave = 'transparent'
    }
    return {
      enter,
      leave,
    }
  }
}

const bodyOwner = Symbol('PopupCtrl')
let stopBodyWatch: (() => void) | undefined
onMounted(() => {
  mounted.value = true
  stopBodyWatch = watch(
    [() => popupList.value.length, () => $props.bgBlur],
    ([count, blur]) => updateBodyEffects(bodyOwner, count > 0, blur),
    { immediate: true, flush: 'post' }
  )
})
onBeforeUnmount(() => {
  stopBodyWatch?.()
  updateBodyEffects(bodyOwner, false, false)
})

// 用於重置apng播放
// let reloadApngCount = 0
// 調試或者本地運行
// const isLocal = /^localhost|^(\d{1,3})(\.(\d{1,3})){3}/.test(location.hostname) || /file:|http:/.test(location.protocol)
// 闪光特效
// const lightApng = `url(${isLocal ? ORIGIN : ''}/img/apng/pop_light.png?v=${reloadApngCount++ % 2})`
// 爆炸特效
// const boomApng = `url(${isLocal ? ORIGIN : ''}/img/apng/boom.png?v=${reloadApngCount++ % 2})`
const animeEvent = (el: any, type: string, name: string, popupItem: any) => {
  const { option } = popupItem
  // boom 播放apng動畫
  if (name === 'boom') {
    if (type === 'beforeEnter') {
      el.style.backgroundPosition = `center center`
      // el.style.backgroundImage = boomApng
    } else if (type === 'afterEnter') {
      el.style.backgroundImage = ''
    }
  }
  // confetti 播放禮炮特效
  if (name === 'confetti' && option.confettiConf) {
    if (type === 'beforeEnter') {
      // option.confettiConf.forEach((confettiConf) => {
      //   confetti(
      //     Object.assign({}, toRaw(confettiConf), {
      //       zIndex: option.zIndex || 99999 + id,
      //     })
      //   )
      // })
    }
  }
}

// 點擊遮罩判斷
const clickMask = (popupItem: any) => {
  let canClose = popupItem.option.maskClose
  // 默認點擊關閉
  if ($props.maskClose && typeof canClose !== 'boolean') {
    canClose = true
  }
  if (canClose) {
    popupItem.close()
  }
}
</script>
<style lang="scss">
// 背景模糊
body.filter-blur > :not(.popup_ctrl):not(.dis_popup_blur),
body.filter-blur > .popup_ctrl > :not(.popup_ctrl_toast) {
  filter: blur(5px);
}
body.filter-blur > .popup_ctrl > .popup_ctrl_mask:last-of-type {
  filter: none;
}

.popup_ctrl {
  z-index: 9999;
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  .popup_ctrl_mask {
    z-index: 1;
    position: absolute;
    pointer-events: auto;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--mask-enter, v-bind('defaultMaskColor.enter'));
    display: flex;
    &.none {
      align-items: center;
      justify-content: center;
    }

    // 中间放大
    &.center {
      align-items: center;
      justify-content: center;
      transition: background 0.3s;
      .popup_ctrl_content {
        transition: transform 0.3s;
      }
      &-enter-from,
      &-leave-to {
        background: var(--mask-leave, v-bind('defaultMaskColor.leave')) !important;
        .popup_ctrl_content {
          transform: scale(0.2);
        }
      }
    }
    // 底部弹出
    &.bottom {
      align-items: flex-end;
      transform: translateY(0);
      transition: background 0.3s;
      .popup_ctrl_content {
        transition: transform 0.3s;
      }
      &-enter-from,
      &-leave-to {
        background: var(--mask-leave, v-bind('defaultMaskColor.leave')) !important;
        .popup_ctrl_content {
          transform: translateY(100%);
        }
      }
    }
    // 彈跳進入
    &.bounce {
      align-items: center;
      justify-content: center;
      transition: background 0.3s;
      // 進入動畫
      @keyframes bounceEnter {
        0% {
          transform: scale(0.8);
          filter: opacity(0);
        }
        14% {
          transform: scale(1.1);
          filter: opacity(1);
        }
        28% {
          transform: scale(1);
        }
        42% {
          transform: scale(1.02);
        }
        60% {
          transform: scale(1);
        }
      }
      // 離開動畫
      @keyframes bounceLeaver {
        from {
          transform: scale(1);
          filter: opacity(1);
        }
        to {
          transform: scale(0.2);
          filter: opacity(0);
        }
      }
      .popup_ctrl_content {
        opacity: 1;
        animation: bounceEnter 1s linear;
        transition: all 0.3s;
      }
      &.bounce-enter-from,
      &.bounce-leave-to {
        background: var(--mask-leave, v-bind('defaultMaskColor.leave')) !important;
      }
      // &.v-enter-from,
      &.bounce-leave-to {
        .popup_ctrl_content {
          animation: bounceLeaver 0.3s linear;
          opacity: 0;
        }
      }
    }
    // 爆炸效果動畫
    &.boom {
      align-items: center;
      justify-content: center;
      // background-image: none;
      transition: background 0.3s;
      background-size: 750px 932px;
      background-position: center center;
      background-repeat: no-repeat;
      // {
      //   size: ;
      //   position: center center;
      //   repeat: no-repeat;
      // }
      .popup_ctrl_content {
        transition: transform 0.3s linear 0.5s, opacity 0.3s linear 0.5s;
      }
      &.boom-enter-from {
        background: var(--mask-leave, v-bind('defaultMaskColor.leave'));
        .popup_ctrl_content {
          opacity: 0;
          transform: scale(0.2);
        }
      }
      // &.boom-enter-active {
      // }
      &.boom-leave-to {
        background: var(--mask-leave, v-bind('defaultMaskColor.leave'));
        .popup_ctrl_content {
          transition: transform 0.3s, opacity 0.3s;
          opacity: 0;
          transform: scale(0.2);
        }
      }
    }

    &.light {
      @extend .bounce;
      // background-image: v-bind(lightApng);
      background-position: center center;
      background-size: 100% auto;
      background-repeat: no-repeat;

      &.light-enter-from,
      &.light-leave-to {
        background: var(--mask-leave, v-bind('defaultMaskColor.leave')) !important;
      }
      &.light-leave-to {
        .popup_ctrl_content {
          animation: bounceLeaver 0.3s linear;
          opacity: 0;
        }
      }
    }

    &.confetti {
      @extend .bounce;

      &.confetti-enter-from,
      &.confetti-leave-to {
        background: var(--mask-leave, v-bind('defaultMaskColor.leave')) !important;
      }
      &.confetti-leave-to {
        .popup_ctrl_content {
          animation: bounceLeaver 0.3s linear;
          opacity: 0;
        }
      }
    }
  }

  // toast樣式
  .popup_ctrl_toast {
    pointer-events: auto;
    user-select: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: max-content;
    max-width: 70%;
    min-width: 250px;
    background: rgba($color: #000, $alpha: var(--opacity, 0.8));
    font-size: 28px;
    font-weight: 400;
    line-height: 32px;
    color: #ffff;
    padding: 14px 40px;
    border-radius: 10px;
    word-break: break-word;
    text-align: center;
    opacity: 1;
    transition: 0.3s opacity;
    &.v-enter-from,
    &.v-leave-to {
      opacity: 0;
    }
  }
}
</style>
