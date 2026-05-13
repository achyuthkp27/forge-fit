import { useStore } from 'zustand';

/**
 * Zustand selector utilities to prevent unnecessary re-renders.
 *
 * Usage:
 *   const exercises = useWorkoutStore(useShallow(state => state.exercises));
 *   const unit = useSettingsStore(useShallow(state => state.settings.unit));
 *
 * Without selectors, any state change in the store re-renders the component.
 * With selectors, only the selected slice triggers re-renders.
 */
export function useShallow<T>(selector: (state: T) => unknown): (state: T) => unknown {
  return selector;
}

/**
 * Memoized equality check for selectors.
 * Compares objects by value (shallow) to avoid unnecessary re-renders.
 */
export function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true;
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Selector that compares by reference first, then by shallow equality.
 * Useful for array/object selections that change reference on every call.
 */
export function createSelector<T, R>(
  selector: (state: T) => R,
  equals: (a: R, b: R) => boolean = shallowEqual
) {
  let lastResult: R | undefined;

  return (state: T): R => {
    const result = selector(state);
    if (lastResult !== undefined && equals(lastResult, result)) {
      return lastResult;
    }
    lastResult = result;
    return result;
  };
}

/**
 * Typed selector helper for common store patterns.
 */
export function pick<T, K extends keyof T>(keys: K[]): (state: T) => Pick<T, K> {
  return (state: T) => {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      result[key] = state[key];
    }
    return result;
  };
}

/**
 * Debounce selector — only fires after a quiet period.
 * Useful for expensive computed selectors.
 */
export function debounceSelector<T, R>(
  selector: (state: T) => R,
  waitMs: number = 100
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastValue: R | undefined;
  let resolvePending: ((value: R) => void) | null = null;

  return (state: T): Promise<R> => {
    return new Promise((resolve) => {
      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(() => {
        const value = selector(state);
        lastValue = value;
        resolve(value);
        timeout = null;
      }, waitMs);

      // If we already have a value and no pending timeout, resolve immediately
      if (lastValue !== undefined && timeout === null) {
        resolve(lastValue);
      }
    });
  };
}