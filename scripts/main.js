(() => {
  const scenes = [...document.querySelectorAll('.scene')];
  const navButtons = [...document.querySelectorAll('[data-scene-index]')];
  const PREVIEW_COMMIT_POINT = 0.58;
  const PREVIEW_SENSITIVITY = 120;
  const WHEEL_END_DELAY = 170;
  const TRANSITION_DURATION = 1100;
  const PREVIEW_RETURN_DURATION = 460;

  const hashIndex = scenes.findIndex((scene) => `#${scene.id}` === window.location.hash);
  const initialIndex = scenes.findIndex((scene) => scene.classList.contains('is-active'));
  let currentIndex = hashIndex >= 0 ? hashIndex : Math.max(0, initialIndex);
  let preview = null;
  let isTransitioning = false;
  let isCancellingPreview = false;
  let wheelEndTimer;
  let transitionTimer;
  let previewReturnTimer;
  let touchStartY = null;

  document.documentElement.classList.add('has-motion');

  const render = () => {
    scenes.forEach((scene, index) => {
      scene.classList.toggle('is-active', index === currentIndex);
      scene.classList.toggle('is-before', index < currentIndex);
      scene.classList.toggle('is-after', index > currentIndex);
      scene.setAttribute('aria-hidden', String(index !== currentIndex));
    });

    navButtons.forEach((button, index) => {
      button.toggleAttribute('aria-current', index === currentIndex);
    });
  };

  const resetSceneAnimationClasses = () => {
    scenes.forEach((scene) => {
      scene.classList.remove(
        'is-entering',
        'is-leaving-next',
        'is-leaving-previous',
        'is-preview-entering',
        'is-preview-outgoing',
        'is-preview-cancelling',
      );
      scene.style.removeProperty('--preview-offset');
      scene.style.removeProperty('--preview-scale');
      scene.style.removeProperty('--preview-opacity');
    });
  };

  const finishTransition = () => {
    isTransitioning = false;
    window.clearTimeout(transitionTimer);
    resetSceneAnimationClasses();
    render();
  };

  const startTransition = (targetIndex, fromPreview = false) => {
    const nextIndex = Math.max(0, Math.min(scenes.length - 1, targetIndex));

    if (nextIndex === currentIndex || isTransitioning || isCancellingPreview) return false;

    const previousIndex = currentIndex;
    const direction = Math.sign(nextIndex - previousIndex);
    const outgoingScene = scenes[previousIndex];
    const incomingScene = scenes[nextIndex];

    outgoingScene.classList.add(direction > 0 ? 'is-leaving-next' : 'is-leaving-previous');
    incomingScene.classList.add('is-entering');

    if (!fromPreview) {
      // Lock the off-screen position into a rendered frame before the transition starts.
      void incomingScene.offsetWidth;
    }

    currentIndex = nextIndex;
    isTransitioning = true;
    render();
    window.history.replaceState(null, '', `#${scenes[currentIndex].id}`);

    window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(finishTransition, TRANSITION_DURATION);

    return true;
  };

  const updatePreview = () => {
    if (!preview) return;

    const { direction, incomingScene, outgoingScene, progress } = preview;
    const incomingOffset = direction * (1 - progress) * 100;
    const outgoingOffset = -direction * progress * 14;

    incomingScene.style.setProperty('--preview-offset', `${incomingOffset}%`);
    outgoingScene.style.setProperty('--preview-offset', `${outgoingOffset}%`);
    outgoingScene.style.setProperty('--preview-scale', String(1 - progress * 0.04));
    outgoingScene.style.setProperty('--preview-opacity', String(1 - progress * 0.54));
  };

  const beginPreview = (direction) => {
    const targetIndex = currentIndex + direction;
    const incomingScene = scenes[targetIndex];
    const outgoingScene = scenes[currentIndex];

    if (!incomingScene || isTransitioning || isCancellingPreview) return false;

    preview = {
      direction,
      targetIndex,
      incomingScene,
      outgoingScene,
      progress: 0,
    };

    incomingScene.classList.add('is-preview-entering');
    outgoingScene.classList.add('is-preview-outgoing');
    updatePreview();
    void incomingScene.offsetWidth;

    return true;
  };

  const cancelPreview = () => {
    if (!preview || isTransitioning) return;

    const cancelledPreview = preview;
    preview = null;
    isCancellingPreview = true;

    cancelledPreview.incomingScene.classList.add('is-preview-cancelling');
    cancelledPreview.outgoingScene.classList.add('is-preview-cancelling');
    cancelledPreview.incomingScene.style.setProperty('--preview-offset', `${cancelledPreview.direction * 100}%`);
    cancelledPreview.outgoingScene.style.setProperty('--preview-offset', '0%');
    cancelledPreview.outgoingScene.style.setProperty('--preview-scale', '1');
    cancelledPreview.outgoingScene.style.setProperty('--preview-opacity', '1');

    window.clearTimeout(previewReturnTimer);
    previewReturnTimer = window.setTimeout(() => {
      isCancellingPreview = false;
      resetSceneAnimationClasses();
      render();
    }, PREVIEW_RETURN_DURATION);
  };

  const discardPreview = () => {
    if (!preview && !isCancellingPreview) return;

    preview = null;
    isCancellingPreview = false;
    window.clearTimeout(wheelEndTimer);
    window.clearTimeout(previewReturnTimer);
    resetSceneAnimationClasses();
    render();
  };

  const commitPreview = () => {
    if (!preview) return;

    const { targetIndex, incomingScene, outgoingScene } = preview;
    preview = null;
    window.clearTimeout(wheelEndTimer);

    incomingScene.classList.remove('is-preview-entering');
    outgoingScene.classList.remove('is-preview-outgoing');
    startTransition(targetIndex, true);
  };

  const normaliseWheelDelta = (event) => {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
    return event.deltaY;
  };

  const schedulePreviewReturn = () => {
    window.clearTimeout(wheelEndTimer);
    wheelEndTimer = window.setTimeout(cancelPreview, WHEEL_END_DELAY);
  };

  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey) return;

    event.preventDefault();
    if (isTransitioning || isCancellingPreview) return;

    const delta = normaliseWheelDelta(event);
    const direction = Math.sign(delta);

    if (!direction) return;

    if (!preview && !beginPreview(direction)) return;

    const amount = Math.min(Math.abs(delta), 60) / PREVIEW_SENSITIVITY;

    if (direction === preview.direction) {
      preview.progress = Math.min(1, preview.progress + amount);
    } else {
      preview.progress = Math.max(0, preview.progress - amount);
    }

    updatePreview();

    if (preview.progress >= PREVIEW_COMMIT_POINT) {
      commitPreview();
      return;
    }

    schedulePreviewReturn();
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

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
    discardPreview();
    startTransition(destination);
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

    if (Math.abs(distance) >= 48) startTransition(currentIndex + Math.sign(distance));
  }, { passive: true });

  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      discardPreview();
      startTransition(Number(button.dataset.sceneIndex));
    });
  });

  scenes.forEach((scene) => {
    scene.addEventListener('transitionend', (event) => {
      if (scene.classList.contains('is-entering') && event.propertyName === 'transform') {
        finishTransition();
      }
    });
  });

  render();
})();
