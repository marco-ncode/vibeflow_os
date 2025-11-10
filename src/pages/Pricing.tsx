function Pricing() {
  return (
    <div className="container">
      <h2>Piani e Prezzi</h2>
      <div className="pricing-grid">
        <div className="card">
          <h3>Starter</h3>
          <p>Per prototipi veloci e singoli utenti.</p>
          <p className="price">€9/mese</p>
          <ul>
            <li>Editor a nodi</li>
            <li>Export JSON</li>
          </ul>
        </div>
        <div className="card highlight">
          <h3>Pro</h3>
          <p>Per team e uso intensivo.</p>
          <p className="price">€29/mese</p>
          <ul>
            <li>Tutto di Starter</li>
            <li>Project management</li>
            <li>Export avanzato</li>
          </ul>
        </div>
        <div className="card">
          <h3>Enterprise</h3>
          <p>Soluzioni su misura e supporto dedicato.</p>
          <p className="price">Contattaci</p>
          <ul>
            <li>SSO e ruoli</li>
            <li>Supporto prioritario</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Pricing