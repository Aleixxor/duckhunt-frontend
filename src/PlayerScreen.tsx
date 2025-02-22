import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000'); // Atualize para a URL do backend

const PlayerScreen = () => {
  const { roomId } = useParams();
  const [orientation, setOrientation] = useState(50); // valor entre 0 e 100
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => {
    socket.emit('joinRoom', { roomId, isHost: false });
    socket.on('playerJoined', (data: { playerId: string }) => {
        console.log(`Player ${data.playerId} joined`);
      // Feedback opcional quando um player entra
    });

    // Usa o DeviceOrientation para captar a inclinação
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null) {
        // Converte de -90 a 90 para 0 a 100
        const value = ((event.gamma + 90) / 180) * 100;
        setOrientation(value);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [roomId]);

  const handleShoot = () => {
    // Envia o evento de tiro com a orientação atual
    socket.emit('shoot', { roomId, playerId: socket.id, orientation });
  };

  const handleConfirmPhase = (e: React.MouseEvent) => {
    // Previne que o clique de confirmação seja confundido com tiro
    e.stopPropagation();
    if (!confirmSent) {
      socket.emit('phaseConfirmed', { roomId, playerId: socket.id });
      setConfirmSent(true);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }} onClick={handleShoot}>
      <h2>Player - Sala {roomId}</h2>
      <p>Toque para atirar</p>
      <button onClick={handleConfirmPhase}>Confirmar Próxima Fase</button>
    </div>
  );
};

export default PlayerScreen;
