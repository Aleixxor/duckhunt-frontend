import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';

// OBS.: No desenvolvimento use o endereço local. No deploy, atualize com a URL do backend.
const socket = io('http://localhost:4000');

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Gera um ID único para a sala (por exemplo, usando os 6 primeiros caracteres do UUID)
    const newRoomId = uuidv4().slice(0, 6);
    setRoomId(newRoomId);

    // Conecta como host na sala
    socket.emit('joinRoom', { roomId: newRoomId, isHost: true });

    // Quando algum player entrar, o backend notifica e redirecionamos o host para a sala
    socket.on('playerJoined', () => {
      navigate(`/host/${newRoomId}`, { state: { role: 'host' } });
    });

    return () => {
      socket.off('playerJoined');
    }
  }, [navigate]);

  const handleJoinRoom = () => {
    if(joinCode.trim()){
      navigate(`/player/${joinCode.trim()}`, { state: { role: 'player' } });
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Bem-vindo ao Chat</h1>
      <p>Sua nova sala: <strong>{roomId}</strong></p>
      <QRCodeSVG value={`${window.location.origin}/player/${roomId}`} />
      <div style={{ marginTop: '20px' }}>
        <h3>Ou entre em outra sala:</h3>
        <input 
          type="text" 
          value={joinCode} 
          onChange={(e) => setJoinCode(e.target.value)} 
          placeholder="Digite o código da sala" 
        />
        <button onClick={handleJoinRoom}>Entrar</button>
      </div>
    </div>
  );
};

export default Home;
