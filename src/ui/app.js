export function createApp(root, { isConnected }) {
  root.innerHTML = `
    <main class="app-shell">
      <header class="app-header">
        <p class="eyebrow">Owlbear Rodeo</p>
        <h1>Aim System</h1>
      </header>
      <section class="status-card" aria-live="polite">
        <span class="status-dot ${isConnected ? 'is-connected' : ''}"></span>
        <p>${isConnected ? 'Connected to Owlbear Rodeo' : 'Running outside Owlbear Rodeo'}</p>
      </section>
    </main>
  `
}
