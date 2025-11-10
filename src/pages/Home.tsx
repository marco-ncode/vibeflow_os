function Home() {
  return (
    <div className="container">
      <header className="hero">
        <h1>VibeFlow - Il builder visivo per i prompt di vibe code!</h1>
        <p>
          Disegna flussi complessi con blocchi visuali, esporta JSON AI‑ready e integrali rapidamente nel tuo editor di codice o nella tua app di vibe coding.
        </p>
        <div className="actions">
          <a className="btn primary" href="/editor">Apri Editor</a>
        </div>
      </header>
      <section className="features">
        <div className="feature">
          <h3>Editor Visuale</h3>
          <p>Costruisci logiche complesse con drag‑and‑drop.</p>
        </div>
        <div className="feature">
          <h3>Export JSON</h3>
          <p>Ottieni JSON strutturato pronto per gli agenti AI.</p>
        </div>
        <div className="feature">
          <h3>Integrazione Semplice</h3>
          <p>Funziona con qualsiasi moderno strumento di coding AI.</p>
        </div>
      </section>
    </div>
  )
}

export default Home