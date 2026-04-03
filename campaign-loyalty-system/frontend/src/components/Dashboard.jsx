import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const hotelId = 1;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats(hotelId);
        setStats(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Dashboard for Hotel {hotelId}</h2>
      <p>Scans Today: {stats.scansToday}</p>
      <p>Rewards: {stats.rewards}</p>
      <p>Suspicious: {stats.suspicious}</p>
    </div>
  );
};

export default Dashboard;