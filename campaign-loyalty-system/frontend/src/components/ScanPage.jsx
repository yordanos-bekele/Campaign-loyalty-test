import { useState } from 'react';
import { scanQr } from '../services/api';

const ScanPage = () => {
  const [token, setToken] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [rewardMessage, setRewardMessage] = useState('');

  const handleScan = async () => {
    try {
      const deviceId = document.cookie.split('; ').find(row => row.startsWith('device_id='))?.split('=')[1] || 'default';
      const response = await scanQr({ token, deviceId });
      setScanCount(response.data.scanCount);
      setRewardMessage(response.data.rewardMessage);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Scan QR Code</h2>
      <input
        type="text"
        placeholder="Enter QR Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        style={{ padding: '10px', margin: '10px', width: '200px' }}
      />
      <br />
      <button onClick={handleScan} style={{ padding: '10px 20px' }}>Scan</button>
      <p>Scan Count: {scanCount}</p>
      <p>Reward: {rewardMessage}</p>
    </div>
  );
};

export default ScanPage;