import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MONITOR_INTERVAL = 5000; // 5 seconds
const TARGET_HOST = 'https://8.8.8.8'; // Google DNS

function App() {
  const [connectivityData, setConnectivityData] = useState([]);
  const [uptime, setUptime] = useState(0);
  const [downtime, setDowntime] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);

    useEffect(() => {
    const intervalId = setInterval(checkConnectivity, MONITOR_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);


  useEffect(() => {
      updateStats();
  }, [connectivityData]);


  const checkConnectivity = async () => {
    const startTime = Date.now();
    let status = 'disconnected';
    let latency = 0;

    try {
      const response = await fetch(TARGET_HOST, { mode: 'no-cors' });
      // We don't check response.ok because of no-cors.  Just assume success if no error.
      status = 'connected';
      latency = Date.now() - startTime;
    } catch (error) {
      // console.error('Connectivity check failed:', error); // Log the error for debugging.
      status = 'disconnected';
    }

    const newEntry = { timestamp: new Date(), status, latency };
    setConnectivityData(prevData => [...prevData, newEntry]);
  };

    const updateStats = () => {
        let upCount = 0;
        let downCount = 0;
        let totalLatency = 0;

        connectivityData.forEach(entry => {
            if (entry.status === 'connected') {
                upCount++;
                totalLatency += entry.latency;
            } else {
                downCount++;
            }
        });

        const total = upCount + downCount;
        setUptime(total > 0 ? (upCount / total) * 100 : 0);
        setDowntime(total > 0 ? (downCount / total) * 100 : 0);
        setAvgLatency(upCount > 0 ? totalLatency / upCount : 0);
    };


  const chartData = {
    labels: connectivityData.map(entry => entry.timestamp.toLocaleTimeString()),
    datasets: [
      {
        label: 'Connectivity Status',
        data: connectivityData.map(entry => entry.status === 'connected' ? 1 : 0),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        yAxisID: 'y-axis-status',
      },
      {
        label: 'Latency (ms)',
        data: connectivityData.map(entry => entry.latency),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
        yAxisID: 'y-axis-latency',
      }
    ]
  };

  const chartOptions = {
    responsive: true, // Make the chart responsive
    maintainAspectRatio: false, // Allow the chart to fill the container
    scales: {
      'y-axis-status': {
        type: 'linear',
        position: 'left',
        min: 0,
        max: 1,
        ticks: {
          stepSize: 1,
          callback: value => (value === 1 ? 'Connected' : 'Disconnected')
        }
      },
      'y-axis-latency': {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Latency (ms)'
        }
      }
    }
  };


  return (
    <div className="container">
      <h1>Internet Connection Monitor</h1>
      <p>Uptime: {uptime.toFixed(2)}%</p>
      <p>Downtime: {downtime.toFixed(2)}%</p>
      <p>Average Latency: {avgLatency.toFixed(2)} ms</p>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}

export default App;
