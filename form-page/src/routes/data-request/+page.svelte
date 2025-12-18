<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import '../styles.css';

  const SOURCE_OPTIONS = ['Material Header', 'Classification', 'Other'];

  let source = SOURCE_OPTIONS[0];
  let tableClass = '';
  let fieldChar = '';
  let reason = '';
  let submitterName = '';
  let submitterEmail = '';

  let loading = false;
  let success = false;
  let fieldErrors = {};
  let showModal = false;
  let modalPayloadLines = [];
  let modalMessage = '';
  let modalVariant = 'success';
  let closingModal = false;

  let dark = true;

  onMount(() => {
    const saved = localStorage.getItem('dv-dark');
    dark = saved !== null ? saved === 'true' : true;
    localStorage.setItem('dv-dark', String(dark));
  });

  function toggleDark() {
    dark = !dark;
    localStorage.setItem('dv-dark', String(dark));
  }

  function validate() {
    const problems = {};
    if (!source) problems.source = 'Choose a source';
    if (!tableClass.trim()) problems.tableClass = 'Table/Class is required';
    if (!fieldChar.trim()) problems.fieldChar = 'Field/Char is required';
    if (!reason.trim()) problems.reason = 'Reason is required';
    if (!submitterName.trim()) problems.submitterName = 'Name is required';
    if (!submitterEmail.trim()) problems.submitterEmail = 'Email is required';
    fieldErrors = problems;
    return Object.keys(problems).length === 0;
  }

  const buildPayload = () => {
    const now = new Date();
    return {
      issue_type: 'Data Request',
      source,
      table_class: tableClass,
      field_char: fieldChar,
      reason,
      submitter_name: submitterName,
      submitter_email: submitterEmail,
      timestamp_iso: now.toISOString(),
      timestamp_local: now.toLocaleString()
    };
  };

  const syntaxHighlight = (json) => {
    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped.replace(
      /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?)/g,
      (match) => {
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

  const toHighlightedLines = (obj) => {
    const str = JSON.stringify(obj, null, 2);
    const highlighted = syntaxHighlight(str);
    return highlighted
      ? highlighted.split('\n').map((line, idx) => ({ number: idx + 1, line }))
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
    success = false;
    modalMessage = '';
    modalPayloadLines = [];
    modalVariant = 'success';

    try {
      const payload = buildPayload();
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || 'Request failed');
      }

      success = true;
      modalMessage = 'Your data request has been sent.';
      modalVariant = 'success';
    } catch (err) {
      modalMessage = err?.message || 'Something went wrong';
      modalVariant = 'error';
    } finally {
      showModal = true;
      closingModal = false;
      loading = false;
    }
  };
</script>

<svelte:head>
  <title>Data Request</title>
</svelte:head>

<div class={`page claude-ui ${dark ? 'dark' : ''}`}>
  <div class="window">
    <div class="toolbar">
      <div class="title claude-title">Data Request</div>
      <div class="toolbar-actions" style="display: flex; gap: 8px; align-items: center;">
        <button class="dark-toggle" on:click={toggleDark} aria-label="Toggle theme">
          <span class:active={dark}></span>
        </button>
        <button type="button" on:click={() => goto('/')}>Back</button>
      </div>
    </div>

    <div class="pane content-enter">
      <section>
        <h2 class="claude-heading">Request Details</h2>
        <p class="subtext claude-body">
          Provide the source and fields for the data you need. You can use this payload with your backend or share it with the team.
        </p>
      </section>

      <form class="claude-body" on:submit|preventDefault={submitForm}>
        <div class="field">
          <label for="source">Source</label>
          <div class="subtext claude-body">Choose the source type.</div>
          <select id="source" bind:value={source} class:error={fieldErrors.source}>
            {#each SOURCE_OPTIONS as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
          {#if fieldErrors.source}<div class="error">{fieldErrors.source}</div>{/if}
        </div>

        <div class="field">
          <label for="table-class">Table/Class</label>
          <input id="table-class" bind:value={tableClass} class:error={fieldErrors.tableClass} />
          {#if fieldErrors.tableClass}<div class="error">{fieldErrors.tableClass}</div>{/if}
        </div>

        <div class="field">
          <label for="field-char">Field/Char</label>
          <input id="field-char" bind:value={fieldChar} class:error={fieldErrors.fieldChar} />
          {#if fieldErrors.fieldChar}<div class="error">{fieldErrors.fieldChar}</div>{/if}
        </div>

        <div class="field">
          <label for="reason">Reason</label>
          <textarea id="reason" rows="3" bind:value={reason} class:error={fieldErrors.reason}></textarea>
          {#if fieldErrors.reason}<div class="error">{fieldErrors.reason}</div>{/if}
        </div>

        <div class="field">
          <div class="subtext claude-body" style="margin-bottom: 6px;">Submitted By</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <div class="subtext">Name</div>
              <input bind:value={submitterName} class:error={fieldErrors.submitterName} />
              {#if fieldErrors.submitterName}<div class="error">{fieldErrors.submitterName}</div>{/if}
            </div>
            <div>
              <div class="subtext">Email</div>
              <input type="email" bind:value={submitterEmail} class:error={fieldErrors.submitterEmail} />
              {#if fieldErrors.submitterEmail}<div class="error">{fieldErrors.submitterEmail}</div>{/if}
            </div>
          </div>
        </div>

        <footer>
          {#if success}<span class="success">Captured</span>{/if}
          <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Save Request'}</button>
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
        aria-label="Data request payload"
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
