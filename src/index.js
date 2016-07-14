import detectHover from 'detect-hover';
import detectPointer from 'detect-pointer';
import detectTouchEvents from 'detect-touch-events';
import detectPointerEvents from 'detect-pointer-events';

/*
 * detectIt object structure
 * const detectIt = {
 *   deviceType: 'mouseOnly' / 'touchOnly' / 'hybrid',
 *   hasTouchEventsApi: boolean,
 *   hasPointerEventsApi: boolean,
 *   pointerEventsPrefix(value) {return value, value will only have prefix if requiresPrefix},
 *   maxTouchPoints: number,
 *   primaryHover: 'hover' / 'none',
 *   primaryPointer: 'fine' / 'coarse' / 'none',
 *   state: {
 *     detectHover,
 *     detectPointer,
 *     detectTouchEvents,
 *     detectPointerEvents,
 *   },
 *   update() {...},
 * }
 */

function robustMax(a, b) {
  function isNum(value) { return typeof value === 'number'; }
  if (isNum(a) && isNum(b)) return Math.max(a, b);
  if (isNum(a)) return a;
  if (isNum(b)) return b;
  return undefined;
}

function determineDeviceType(hasTouch, anyHover, anyFine) {
  /*
   * A hybrid device is one that both hasTouch and any input device can either hover
   * or has a fine pointer. For example, the Galaxy Note with stylus registers
   * that one of it's input devices has a fine pointer (i.e. the stylus), but
   * only that it can hover on-demand (which can't be used as a determinant because
   * all Android touch only devices also say they can hover on-demand
   * because a hover state can be activated on Android via a long press)
   */
  if (hasTouch && (anyHover || anyFine)) return 'hybrid';

  /*
   * In almost all cases a device that doesn’t support touch will have a mouse,
   * but there may be rare exceptions. Note that it doesn’t work to do additional tests
   * based on hover and pointer media queries as older browsers don’t support these.
   * Essentially, 'mouseOnly' is the default.
   */
  return hasTouch ? 'touchOnly' : 'mouseOnly';
}

const detectIt = {
  state: {
    detectHover,
    detectPointer,
    detectTouchEvents,
    detectPointerEvents,
  },
  update() {
    detectIt.state.detectHover.update();
    detectIt.state.detectPointer.update();
    detectIt.state.detectTouchEvents.update();
    detectIt.state.detectPointerEvents.update();
    detectIt.updateOnlyOwnProperties();
  },
  updateOnlyOwnProperties() {
    if (typeof window !== 'undefined') {
      detectIt.deviceType = determineDeviceType(
        (detectIt.state.detectTouchEvents.hasApi || detectIt.state.detectPointerEvents.hasTouch),
        detectIt.state.detectHover.anyHover,
        detectIt.state.detectPointer.anyFine
      );

      detectIt.hasTouchEventsApi = detectIt.state.detectTouchEvents.hasApi;
      detectIt.hasPointerEventsApi = detectIt.state.detectPointerEvents.hasApi;
      detectIt.maxTouchPoints = robustMax(
        detectIt.state.detectTouchEvents.maxTouchPoints,
        detectIt.state.detectPointerEvents.maxTouchPoints
      );

      detectIt.primaryHover =
        (detectIt.state.detectHover.hover && 'hover') ||
        (detectIt.state.detectHover.none && 'none') ||
        // if it's a mouseOnly device that doesn't support the level 4 media queries,
        // then assume it hovers
        (detectIt.deviceType === 'mouseOnly' && 'hover') ||
        // if it's a touchOnly device that doesn't support level 4 media queries,
        // then assume it doesn't hover, otherwise it's undefined
        (detectIt.deviceType === 'touchOnly' && 'none') || undefined;

      detectIt.primaryPointer =
        (detectIt.state.detectPointer.fine && 'fine') ||
        (detectIt.state.detectPointer.coarse && 'coarse') ||
        (detectIt.state.detectPointer.none && 'none') ||
        // if it's a mouseOnly device that doesn't support level 4 media queries,
        // then assume it has a fine pointer
        (detectIt.deviceType === 'mouseOnly' && 'fine') ||
        // if it's a touchOnly device that doesn't support level 4 media queries,
        // then assume it has a coarse pointer, otherwise it's undefined
        (detectIt.deviceType === 'touchOnly' && 'coarse') || undefined;
    }
  },
  pointerEventsPrefix: detectPointerEvents.prefix,
};

detectIt.updateOnlyOwnProperties();
export default detectIt;
