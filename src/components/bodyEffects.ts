interface BodyState {
  overflow: string;
  priority: string;
  blurred: boolean;
  owners: Map<symbol, boolean>;
}

const bodyStates = new WeakMap<HTMLElement, BodyState>();

/** 多个控制容器共存时，只有最后一个使用者释放后才恢复页面。 */
export function updateBodyEffects(owner: symbol, active: boolean, blur: boolean): void {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.body;
  let state = bodyStates.get(body);
  if (active) {
    if (!state) {
      state = {
        overflow: body.style.getPropertyValue('overflow'),
        priority: body.style.getPropertyPriority('overflow'),
        blurred: body.classList.contains('filter-blur'),
        owners: new Map()
      };
      bodyStates.set(body, state);
    }
    state.owners.set(owner, blur);
  } else {
    if (!state) return;
    state.owners.delete(owner);
  }

  if (state.owners.size) {
    body.style.setProperty('overflow', 'hidden');
    body.classList.toggle('filter-blur', state.blurred || [...state.owners.values()].some(Boolean));
  } else {
    if (state.overflow) body.style.setProperty('overflow', state.overflow, state.priority);
    else body.style.removeProperty('overflow');
    body.classList.toggle('filter-blur', state.blurred);
    bodyStates.delete(body);
  }
}
