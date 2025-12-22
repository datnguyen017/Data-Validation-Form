<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  const FUNCTIONAL_ISSUE_OPTIONS = ['YAML Editor', 'Report', 'Other'];

  let functionalIssueType = '';
  let otherProblem = '';

  type FieldErrors = Partial<Record<'functionalIssueType' | 'otherProblem', string>>;
  let fieldErrors: FieldErrors = {};
  let showModal = false;
  let modalPayloadLines: Array<{ number: number; line: string }> = [];
  let modalMessage = '';
  let modalVariant: 'success' | 'error' | 'info' = 'success';
  let closingModal = false;

  let dark = true;
  let loading = false;

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

  $: {
    if (functionalIssueType !== 'Other' && otherProblem) otherProblem = '';
  }

  function validate() {
    const problems: FieldErrors = {};
    if (!functionalIssueType) problems.functionalIssueType = 'Please select one.';
    if (functionalIssueType === 'Other' && !otherProblem.trim()) {
      problems.otherProblem = 'Please describe your problem.';
    }
    fieldErrors = problems;
    return Object.keys(problems).length === 0;
  }

  type FunctionalIssuePayload = {
    issue_type: 'Functional Issue';
    functional_issue_type: string;
    other_problem?: string;
    date: string;
    timestamp_iso: string;
    timestamp_local: string;
  };

  const buildPayload = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const base: FunctionalIssuePayload = {
      issue_type: 'Functional Issue',
      functional_issue_type: functionalIssueType,
      date,
      timestamp_iso: now.toISOString(),
      timestamp_local: now.toLocaleString()
    };

    if (functionalIssueType === 'Other') {
      base.other_problem = otherProblem.trim();
    }

    return base;
  };

  const syntaxHighlight = (json: string) => {
    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped.replace(
      /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?)/g,
      (match: string) => {
        if (/^"/.test(match)) {
          return /:$/.test(match)
            ? `<span class="code-key">${match}</span>`
            : `<span class="code-string">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span class="code-boolean">${match}</span>`;
        if (match === 'null') return `<span class="code-null">${match}</span>`;
        return `<span class="code-number-value">${match}</span>`;
      }
    );
  };

  const toHighlightedLines = (obj: unknown) => {
    const str = JSON.stringify(obj, null, 2);
    const highlighted = syntaxHighlight(str);
    return highlighted
      ? highlighted.split('\n').map((line: string, idx: number) => ({ number: idx + 1, line }))
      : [];
  };

  function showDebugPayload() {
    modalPayloadLines = toHighlightedLines(buildPayload());
    modalMessage = '';
    modalVariant = 'info';
    closingModal = false;
    showModal = true;
  }

  const closeModal = () => {
    if (closingModal) return;
    closingModal = true;
    setTimeout(() => {
      showModal = false;
      closingModal = false;
    }, 180);
  };

  const submitForm = async () => {
    if (loading) return;
    if (!validate()) return;
    loading = true;

    try {
      const payload = buildPayload();
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { error?: string })?.error || 'Request failed');
      }

      const createdId = (body as { itemId?: string })?.itemId;
      modalMessage = createdId
        ? `Your functional issue has been sent. Item ID: ${createdId}.`
        : 'Your functional issue has been sent.';
      modalVariant = 'success';
    } catch (err) {
      modalMessage = err instanceof Error ? err.message : 'Something went wrong';
      modalVariant = 'error';
    } finally {
      modalPayloadLines = [];
      showModal = true;
      closingModal = false;
      loading = false;
    }
  };
</script>

<svelte:head>
  <title>Functional Issue</title>
</svelte:head>

<div class={`page claude-ui ${dark ? 'dark' : ''}`}>
  <div class="window">
    <div class="toolbar">
      <div class="title claude-title">Functional Issue</div>
      <div class="toolbar-actions" style="display: flex; gap: 8px; align-items: center;">
        <button class="dark-toggle" on:click={toggleDark} aria-label="Toggle theme">
          <span class:active={dark}></span>
        </button>
        <button type="button" on:click={() => goto('/')}>Back</button>
      </div>
    </div>

    <div class="pane content-enter">
      <section>
        <h2 class="claude-heading">Issue Type</h2>
        <p class="subtext claude-body">
          Select the area you’re having trouble with.
        </p>
      </section>

      <form class="claude-body" on:submit|preventDefault={submitForm}>
        <div class="field">
          <label for="functional-issue-type">Functional Issue</label>
          <div class="subtext claude-body">Choose one option.</div>
          <select
            id="functional-issue-type"
            bind:value={functionalIssueType}
            class:error={Boolean(fieldErrors.functionalIssueType)}
          >
            <option value="">Select one</option>
            {#each FUNCTIONAL_ISSUE_OPTIONS as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
          {#if fieldErrors.functionalIssueType}<div class="error">{fieldErrors.functionalIssueType}</div>{/if}
        </div>

        {#if functionalIssueType === 'Other'}
          <div class="field">
            <label for="other-problem">Describe your problem</label>
            <div class="subtext claude-body">Tell us what’s going wrong.</div>
            <textarea
              id="other-problem"
              rows="4"
              bind:value={otherProblem}
              class:error={Boolean(fieldErrors.otherProblem)}
            ></textarea>
            {#if fieldErrors.otherProblem}<div class="error">{fieldErrors.otherProblem}</div>{/if}
          </div>
        {/if}

        <footer>
          <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
        </footer>
      </form>
    </div>
  </div>

  <button class="debug-button" on:click={showDebugPayload}>Show Payload</button>

  {#if showModal}
    <div
      class="modal-backdrop"
      class:closing={closingModal}
      role="button"
      tabindex="0"
      aria-label="Close dialog"
      on:click={closeModal}
      on:keydown={(e) => e.key === 'Escape' && closeModal()}
    >
      <div
        class="modal"
        class:closing={closingModal}
        role="dialog"
        aria-modal="true"
        aria-label="Functional issue payload"
        tabindex="-1"
        on:click|stopPropagation
        on:keydown={(e) => e.key === 'Escape' && closeModal()}
      >
        {#if modalVariant === 'info'}
          <div class="code-block">
            <div class="code-header">
              <span class="code-title">Payload</span>
              <span class="code-meta">JSON | {modalPayloadLines.length} lines</span>
            </div>
            <div class="code-body" role="presentation">
              {#each modalPayloadLines as line}
                <div class="code-line">
                  <span class="code-number">{line.number}</span>
                  <span class="code-text">{@html line.line}</span>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div class="modal-message">{modalMessage}</div>
        {/if}
        <div class="modal-actions">
          <button class="modal-close" on:click={closeModal}>Close</button>
        </div>
      </div>
    </div>
  {/if}
</div>
