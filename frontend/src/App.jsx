import { useState, useEffect } from 'react'
import axios from 'axios'
import ChartComponent from './components/ChartComponent'
import InfoBox from './components/InfoBox'
import HealthStatus from './components/HealthStatus'
import './App.css'

// En desarrollo usa el proxy de Vite, en producción usa la variable de entorno
const API_URL = import.meta.env.VITE_API_URL || '/api'

function App() {
  const [info, setInfo] = useState(null)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/info`)
      setInfo(response.data)
    } catch (error) {
      console.error('Error loading info:', error)
      setInfo({ error: 'Error al cargar información' })
    }
  }

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`)
      setHealth(response.data)
    } catch (error) {
      console.error('Error checking health:', error)
      setHealth({ status: 'error' })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadInfo(), checkHealth()])
      setLoading(false)
    }
    loadData()
  }, [])

  return (
    <div className="app">
      <div className="container">
        <h1>🚂 Railway Deployment</h1>
        <p className="subtitle">Aplicación web con React + Flask</p>
        
        <InfoBox info={info} onRefresh={loadInfo} loading={loading} />
        
        <HealthStatus health={health} onRefresh={checkHealth} />
        
        <div className="info-box">
          <h3>📊 Gráfica de Datos</h3>
          <ChartComponent apiUrl={API_URL} />
        </div>

        <div className="button-group">
          <button className="btn" onClick={loadInfo}>🔄 Actualizar Info</button>
          <button className="btn" onClick={checkHealth}>❤️ Verificar Salud</button>
        </div>
      </div>
    </div>
  )
}

export default App
