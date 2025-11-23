function InfoBox({ info, onRefresh, loading }) {
  if (loading && !info) {
    return (
      <div className="info-box">
        <h3>Información del Sistema</h3>
        <div className="info-item loading">Cargando información...</div>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="info-box">
        <h3>Información del Sistema</h3>
        <div className="info-item">No hay información disponible</div>
      </div>
    )
  }

  if (info.error) {
    return (
      <div className="info-box">
        <h3>Información del Sistema</h3>
        <div className="info-item" style={{ color: 'red' }}>{info.error}</div>
      </div>
    )
  }

  return (
    <div className="info-box">
      <h3>Información del Sistema</h3>
      <div className="info-content">
        <div className="info-item">
          <strong>Mensaje:</strong> {info.message}
        </div>
        <div className="info-item">
          <strong>Entorno:</strong> {info.environment}
        </div>
        <div className="info-item">
          <strong>Python:</strong> {info.python_version}
        </div>
      </div>
    </div>
  )
}

export default InfoBox

