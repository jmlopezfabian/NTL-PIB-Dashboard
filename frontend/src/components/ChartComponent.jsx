import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import axios from 'axios'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

function ChartComponent({ apiUrl }) {
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadChart = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${apiUrl}/chart-data`)
      setChartData(response.data)
    } catch (error) {
      console.error('Error loading chart:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChart()
  }, [apiUrl])

  if (loading) {
    return <div className="loading">Cargando gráfica...</div>
  }

  if (!chartData) {
    return <div className="error">Error al cargar la gráfica</div>
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: true,
        text: 'Visitas Semanales',
        font: {
          size: 16
        }
      },
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10
        }
      }
    }
  }

  return (
    <div className="chart-container">
      <Line data={chartData} options={options} />
      <button className="btn-small" onClick={loadChart}>
        🔄 Actualizar Gráfica
      </button>
    </div>
  )
}

export default ChartComponent

