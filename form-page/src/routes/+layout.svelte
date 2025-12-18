<script>
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { page } from '$app/stores';
  import './styles.css';

  let reduceMotion = false;

  function pageTransition(node, { duration = 220 } = {}) {
    const dy = reduceMotion ? 0 : 10;
    const blur = reduceMotion ? 0 : 8;
    const transitionDuration = reduceMotion ? 0 : duration;

    return {
      duration: transitionDuration,
      easing: cubicOut,
      css: (t) =>
        `opacity: ${t}; transform: translateY(${(1 - t) * dy}px); filter: blur(${(1 - t) * blur}px);`
    };
  }

  function applyRootTheme(isDark) {
    document.documentElement.classList.toggle('dv-dark', Boolean(isDark));
  }

  onMount(() => {
    reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    const saved = localStorage.getItem('dv-dark');
    const isDark = saved !== null ? saved === 'true' : true;
    applyRootTheme(isDark);

    const onTheme = (event) => {
      const isDarkNext = Boolean(event?.detail?.dark);
      applyRootTheme(isDarkNext);
    };

    const onStorage = (event) => {
      if (event?.key !== 'dv-dark') return;
      applyRootTheme(event?.newValue === 'true');
    };

    window.addEventListener('dv-theme', onTheme);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('dv-theme', onTheme);
      window.removeEventListener('storage', onStorage);
    };
  });
</script>

{#key $page.url.pathname}
  <div class="route-transition" transition:pageTransition={{ duration: 220 }}>
    <slot />
  </div>
{/key}

<style>
  .route-transition {
    min-height: 100vh;
    will-change: transform, opacity, filter;
  }
</style>
