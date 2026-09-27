(() => {
  const scenes = [...document.querySelectorAll('.scene')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const WHEEL_THRESHOLD = 28;
  const WHEEL_END_DELAY = 180;
  const TRANSITION_DURATION = 1100;

  const hashIndex = scenes.findIndex((scene) => `#${scene.id}` === window.location.hash);
  const initialIndex = scenes.findIndex((scene) => scene.classList.contains('is-active'));
  let currentIndex = hashIndex >= 0 ? hashIndex : Math.max(0, initialIndex);
  let wheelAmount = 0;
  let wheelDirection = 0;
  let wheelEndTimer;
  let transitionTimer;
  let gestureLocked = false;
  let isTransitioning = false;
  let touchStartY = null;

  document.documentElement.classList.add('has-motion');

  const render = () => {
    scenes.forEach((scene, index) => {
      scene.classList.toggle('is-active', index === currentIndex);
      scene.classList.toggle('is-before', index < currentIndex);
      scene.classList.toggle('is-after', index > currentIndex);
      scene.setAttribute('aria-hidden', String(index !== currentIndex));
    });
  };

  const finishTransition = () => {
    isTransitioning = false;
    window.clearTimeout(transitionTimer);
  };

  const goTo = (nextIndex) => {
    const boundedIndex = Math.max(0, Math.min(scenes.length - 1, nextIndex));

    if (boundedIndex === currentIndex || isTransitioning) return false;

    currentIndex = boundedIndex;
    isTransitioning = !reduceMotion.matches;
    render();

    window.history.replaceState(null, '', `#${scenes[currentIndex].id}`);

    if (isTransitioning) {
      window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(finishTransition, TRANSITION_DURATION);
    }

    return true;
  };

  const endWheelGesture = () => {
    wheelAmount = 0;
    wheelDirection = 0;
    gestureLocked = false;
  };

  const normalizedWheelDelta = (event) => {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
    return event.deltaY;
  };

  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey) return;

    event.preventDefault();
    window.clearTimeout(wheelEndTimer);
    wheelEndTimer = window.setTimeout(endWheelGesture, WHEEL_END_DELAY);

    if (gestureLocked || isTransitioning) return;

    const delta = normalizedWheelDelta(event);
    const direction = Math.sign(delta);

    if (!direction) return;

    if (wheelDirection && direction !== wheelDirection) wheelAmount = 0;

    wheelDirection = direction;
    wheelAmount += Math.min(Math.abs(delta), WHEEL_THRESHOLD);

    if (wheelAmount < WHEEL_THRESHOLD) return;

    gestureLocked = true;
    goTo(currentIndex + direction);
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || isTransitioning) return;

    const destination = {
      ArrowDown: currentIndex + 1,
      PageDown: currentIndex + 1,
      Space: event.shiftKey ? currentIndex - 1 : currentIndex + 1,
      ArrowUp: currentIndex - 1,
      PageUp: currentIndex - 1,
      Home: 0,
      End: scenes.length - 1,
    }[event.code];

    if (destination === undefined) return;

    event.preventDefault();
    goTo(destination);
  });

  window.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) touchStartY = event.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (touchStartY !== null) event.preventDefault();
  }, { passive: false });

  window.addEventListener('touchend', (event) => {
    if (touchStartY === null || isTransitioning) return;

    const distance = touchStartY - event.changedTouches[0].clientY;
    touchStartY = null;

    if (Math.abs(distance) >= 48) goTo(currentIndex + Math.sign(distance));
  }, { passive: true });

  scenes.forEach((scene) => {
    scene.addEventListener('transitionend', (event) => {
      if (scene.classList.contains('is-active') && event.propertyName === 'transform') {
        finishTransition();
      }
    });
  });

  render();
})();
