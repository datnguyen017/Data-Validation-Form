<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  const forms = [
    {
      title: 'Data Validation',
      description: 'Submit validation rules, expected values, and filters so the team can verify data quality quickly.',
      href: '/data-validation',
      cta: 'Open validation form'
    },
    {
      title: 'Data Request',
      description: 'Request data pulls or new datasets with sources, tables, and field details.',
      href: '/data-request',
      cta: 'Open data request'
    },
    {
      title: 'Functional Issue',
      description: 'Report UI or workflow problems in the data tools and track them to resolution.',
      href: '/functional-issue',
      cta: 'Report an issue'
    }
  ];

  let dark = true;

  onMount(() => {
    const saved = localStorage.getItem('dv-dark');
    dark = saved !== null ? saved === 'true' : true;
    localStorage.setItem('dv-dark', String(dark));
    window.dispatchEvent(new CustomEvent('dv-theme', { detail: { dark } }));
  });

  function toggleDark() {
    dark = !dark;
    localStorage.setItem('dv-dark', String(dark));
    window.dispatchEvent(new CustomEvent('dv-theme', { detail: { dark } }));
  }
</script>

<svelte:head>
  <title>Data Operations | Forms Hub</title>
</svelte:head>

<div class={`landing claude-ui ${dark ? 'dark' : ''}`}>
  <div class="landing-hero">
    <div class="hero-copy">
      <p class="eyebrow">Data Operations</p>
      <h1>Route requests to the right form</h1>
      <p class="lede">
        Choose the workflow you need—validate data, request new datasets, or flag functional issues.
        Everything stays consistent across the platform.
      </p>
      <div class="hero-actions">
        <button on:click={() => goto('/data-validation')}>Start Data Validation</button>
        <button class="ghost" on:click={() => goto('/data-request')}>Data Request</button>
      </div>
    </div>

    <div class="hero-card">
      <div class="hero-card-header">
        <div>
          <div class="hero-card-label">Quick links</div>
          <div class="hero-card-title">Forms Hub</div>
        </div>
        <button class="dark-toggle" on:click={toggleDark} aria-label="Toggle theme">
          <span class:active={dark}></span>
        </button>
      </div>
      <div class="hero-links">
        {#each forms as form}
          <button class="hero-link" on:click={() => goto(form.href)}>
            <div>
              <div class="hero-link-title">{form.title}</div>
              <div class="hero-link-text">{form.description}</div>
            </div>
            <span aria-hidden="true">→</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="landing-grid">
    {#each forms as form}
      <div class="landing-card">
        <div class="card-top">
          <div class="card-title">{form.title}</div>
          <div class="card-kicker">{form.cta}</div>
        </div>
        <p class="card-text">{form.description}</p>
        <div class="card-actions">
          <button on:click={() => goto(form.href)}>Open</button>
        </div>
      </div>
    {/each}
  </div>
</div>
