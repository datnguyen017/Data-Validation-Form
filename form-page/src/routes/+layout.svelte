<script>
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { crossfade } from 'svelte/transition';
  import { page } from '$app/stores';
  import './styles.css';

  let reduceMotion = false;

  const [send, receive] = crossfade({
    duration: () => (reduceMotion ? 0 : 240),
    easing: cubicInOut,
    fallback: (node, params) => {
      const dy = reduceMotion ? 0 : 8;
      const duration = reduceMotion ? 0 : 200;
      return {
        duration,
        easing: cubicInOut,
        css: (t) => `opacity: ${t}; transform: translateY(${(1 - t) * dy}px);`
      };
    }
  });

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
  <div class="route-transition" in:receive out:send>
    <slot />
  </div>
{/key}

<style>
  .route-transition {
    min-height: 100vh;
    will-change: transform, opacity, filter;
  }
</style>
