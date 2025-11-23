function HealthStatus({ health, onRefresh }) {
  if (!health) {
    return (
      <div className="info-box">
        <h3>Estado del Servidor</h3>
        <div className="status loading">Verificando...</div>
      </div>
    )
  }

  const isHealthy = health.status === 'healthy'

  return (
    <div className="info-box">
      <h3>Estado del Servidor</h3>
      <div className={`status ${isHealthy ? 'healthy' : 'error'}`}>
        {isHealthy ? '✓ Servidor saludable' : '✗ Error en el servidor'}
      </div>
    </div>
  )
}

export default HealthStatus

