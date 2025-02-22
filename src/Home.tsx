import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { database, ref, set, onChildAdded } from './firebase';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Gera um ID único para a sala (6 primeiros caracteres do UUID)
    const newRoomId = uuidv4().slice(0, 6);
    setRoomId(newRoomId);

    // Cria a sala no Firebase com dados iniciais
    set(ref(database, `rooms/${newRoomId}`), {
      players: {},
      gameState: 'waiting'
    });

    // Ouve quando um novo jogador é adicionado na sala
    const playersRef = ref(database, `rooms/${newRoomId}/players`);
    onChildAdded(playersRef, () => {
      // Assim que algum player entrar, redireciona o host para a tela de host
      navigate(`/host/${newRoomId}`, { state: { role: 'host' } });
    });
  }, [navigate]);

  const handleJoinRoom = () => {
    if (joinCode.trim()) {
      navigate(`/player/${joinCode.trim()}`, { state: { role: 'player' } });
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Bem-vindo ao Duck Hunt</h1>
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
