function Help() {
  return (
    <div className="container">
      <h2>Guida</h2>
      <p>
        Scopri come funziona l’editor a nodi e l’export JSON. Consulta la guida
        ufficiale per approfondimenti.
      </p>
      <ul>
        <li>
          <a href="https://www.flowcrest.app/nodeprompter/help/help.html" target="_blank" rel="noreferrer">
            Documentazione Flowcrest
          </a>
        </li>
      </ul>
      <p>
        Suggerimento: crea un nuovo nodo, collegalo e prova l’export per vedere la
        struttura JSON generata.
      </p>
    </div>
  )
}

export default Help