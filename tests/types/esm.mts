import Plugin, { usePopupStore, PopupCtrl, type PopupConfig } from 'vue-popup-ctrl';
import { createApp, defineComponent } from 'vue';

const TypedPopup = defineComponent({
  props: { id: { type: Number, required: true }, title: String },
  emits: { confirm: (value: { ok: boolean }) => typeof value.ok === 'boolean' },
  setup() { return { done: () => true }; }
});

declare module 'vue' {
  interface GlobalComponents {
    PopupTyped: typeof TypedPopup;
  }
}

createApp({}).use(Plugin, { maskClose: true });
const controllerProps: InstanceType<typeof PopupCtrl>['$props'] = { opacity: 0.2, bgBlur: true };
// @ts-expect-error the public controller signature must retain prop types
const invalidControllerProps: InstanceType<typeof PopupCtrl>['$props'] = { opacity: '0.2' };
const config: PopupConfig = { opacity: 0, maskStyle: null };
const store = usePopupStore(config);
const popup = store.open('PopupTyped', { id: 1 });
const instanceResult: boolean | undefined = popup.ref?.done();
const chainedInstance: boolean | undefined = popup.config({ opacity: 0 }).props({ id: 2 }).on('confirm', () => {}).ref?.done();
const chainedShow: boolean = popup.un('confirm', () => {}).show;
const result: Promise<{ ok: boolean }> = popup.on('confirm');
popup.on('confirm', value => { const ok: boolean = value.ok; void ok; });
popup.on('close', close => close());
store.open('PopupTyped?id=1', { id: 1 });
store.open('UnregisteredPopup', { arbitrary: true });
// @ts-expect-error registered props must retain their type
store.open('PopupTyped', { id: 'wrong' });
// @ts-expect-error typed callback data must not degrade to any
popup.on('confirm', value => { const wrong: number = value.ok; void wrong; });
// @ts-expect-error the inferred Promise must retain its payload type
const wrongResult: Promise<string> = popup.on('confirm');
void [PopupCtrl, result, instanceResult, wrongResult, chainedInstance, chainedShow, controllerProps, invalidControllerProps];
