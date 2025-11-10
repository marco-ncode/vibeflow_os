function Home() {
  return (
    <div className="container">
      <header className="hero">
        <h1>VibeFlow <br /> Il builder visivo per i prompt di vibe code!</h1>
        <p>
          Disegna flussi complessi con blocchi visuali, esporta JSON AI‑ready,<br />integrali rapidamente nel tuo editor di codice o nella tua app di vibe coding.
        </p>
        <div className="actions">
          <a className="btn primary" href="/editor">Apri Editor</a>
        </div>
      </header>
      <section className="features">
        <div className="feature">
          <div className="feature-icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="2" />
              <circle cx="18" cy="6" r="2" />
              <circle cx="6" cy="18" r="2" />
              <circle cx="18" cy="18" r="2" />
              <path d="M8 6h8M6 8v8M18 8v8M8 18h8" />
            </svg>
          </div>
          <h3>Editor Visuale</h3>
          <p>Costruisci logiche complesse con drag‑and‑drop.</p>
        </div>
        <div className="feature">
          <div className="feature-icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M8 12h8M10 9h4M10 15h4" />
              <path d="M7 8v8M17 8v8" opacity=".5" />
            </svg>
          </div>
          <h3>Export JSON</h3>
          <p>Ottieni JSON strutturato pronto per gli agenti AI.</p>
        </div>
        <div className="feature">
          <div className="feature-icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4c-2 0-3.5 1.5-3.5 3.5v1c-1.6 0-3 1.3-3 3v1c0 1.9 1.4 3.2 3 3.2v1c0 2 1.6 3.3 3.5 3.3" />
              <path d="M12 4c2 0 3.5 1.5 3.5 3.5v1c1.6 0 3 1.3 3 3v1c0 1.9-1.4 3.2-3 3.2v1c0 2-1.6 3.3-3.5 3.3" />
              <path d="M12 4v16" />
              <circle cx="6.5" cy="8" r="1" />
              <path d="M7.8 8H12" />
              <circle cx="17.5" cy="8" r="1" />
              <path d="M12 8h4.7" />
              <circle cx="6.5" cy="12" r="1" />
              <path d="M7.8 12H12" />
              <circle cx="17.5" cy="12" r="1" />
              <path d="M12 12h4.7" />
              <circle cx="6.5" cy="16" r="1" />
              <path d="M7.8 16H12" />
              <circle cx="17.5" cy="16" r="1" />
              <path d="M12 16h4.7" />
            </svg>
          </div>
          <h3>Integrazione Semplice</h3>
          <p>Funziona con qualsiasi moderno strumento di coding AI.</p>
        </div>
      </section>
    </div>
  )
}

export default Home