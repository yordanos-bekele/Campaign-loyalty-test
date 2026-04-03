import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { generateQrToken } from '../services/api';

const QrDisplay = () => {
  const [qrCode, setQrCode] = useState('');
  const hotelId = 1;

  const fetchQr = async () => {
    try {
      const response = await generateQrToken(hotelId);
      const token = response.data.token;
      const qr = await QRCode.toDataURL(token);
      setQrCode(qr);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchQr();
    const interval = setInterval(fetchQr, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>QR Code for Hotel {hotelId}</h2>
      {qrCode && <img src={qrCode} alt="QR Code" style={{ width: '200px', height: '200px' }} />}
    </div>
  );
};

export default QrDisplay;