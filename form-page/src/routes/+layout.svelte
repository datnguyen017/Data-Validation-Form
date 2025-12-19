<script>
  import { beforeNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { page } from '$app/stores';
  import './styles.css';

  let reduceMotion = false;
  let navDirection = 'forward';
  let navKey = 0;

  function pageTransition(node, { duration = 220 } = {}) {
    const dy = reduceMotion ? 0 : 8;
    const scaleFrom = reduceMotion ? 1 : 0.985;
    const transitionDuration = reduceMotion ? 0 : duration;

    return {
      duration: transitionDuration,
      easing: cubicOut,
      css: (t) => {
        const y = (1 - t) * dy;
        const scale = scaleFrom + (1 - scaleFrom) * t;
        return `opacity: ${t}; transform: translateY(${y}px) scale(${scale});`;
      }
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

  beforeNavigate((nav) => {
    navKey += 1;
    navDirection = nav?.type === 'popstate' && (nav.delta ?? 0) < 0 ? 'back' : 'forward';
  });
</script>

<nav class="global-nav claude-ui">
  <div class="nav-inner">
    <a class="nav-logo" href="/">Data Forms</a>
    <div class="nav-links">
      <a href="/data-validation">Data Validation</a>
      <a href="/data-request">Data Request</a>
      <a href="/functional-issue">Functional Issue</a>
    </div>
  </div>
</nav>

{#key `${navKey}:${$page.url.pathname}`}
  <div class="route-transition" data-nav={navDirection} transition:pageTransition={{ duration: 180 }}>
    <slot />
  </div>
{/key}

<style>
  .route-transition {
    min-height: calc(100vh - 64px);
    will-change: transform, opacity, filter;
  }
</style>
