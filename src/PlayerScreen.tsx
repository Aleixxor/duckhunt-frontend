import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { database, ref, set, push, update } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { PlayerPosition } from './types';

const PlayerScreen = () => {
  const { roomId } = useParams();
  const [orientation, setOrientation] = useState(50); // valor entre 0 e 100
  const [playerId, setPlayerId] = useState<string>('');
  const [confirmSent, setConfirmSent] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>();

  // Ao montar, gera um ID único e adiciona o jogador na sala
  useEffect(() => {
    const id = uuidv4();
    setPlayerId(id);
    set(ref(database, `rooms/${roomId}/players/${id}`), {
      id: id,
      score: 0,
      confirmed: false,
    });
  }, [roomId]);

  // Usa o DeviceOrientation para captar a inclinação do dispositivo
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // const acl = new Accelerometer({ frequency: 60 });
      // acl.addEventListener("reading", () => {
      //   console.log(`Acceleration x: ${acl.x}, y: ${acl.y}, z: ${acl.z}`);
      // });

      // acl.start();

      const _playerPosition: PlayerPosition = { 
        alpha: event.alpha ?? 0, 
        beta: event.beta ?? 0, 
        gamma: event.gamma ?? 0
      };
      setPlayerPosition(_playerPosition);
      push(ref(database, `rooms/${roomId}/players/${playerId}/position`), _playerPosition);

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
  }, []);

  // Ao tocar na tela, envia um tiro para o Firebase
  const handleShoot = () => {
    const shotData = {
      playerId,
      orientation,
      timestamp: Date.now(),
    };
    // Cria um novo nó em "shots" dentro da sala
    push(ref(database, `rooms/${roomId}/shots`), shotData);
  };

  // Confirma o início da próxima fase
  const handleConfirmPhase = (e: React.MouseEvent) => {
    // Evita que o clique de confirmação seja confundido com o tiro
    e.stopPropagation();
    if (!confirmSent) {
      update(ref(database, `rooms/${roomId}/players/${playerId}`), { confirmed: true });
      setConfirmSent(true);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }} onClick={handleShoot}>
      <h2>Participante - Sala {roomId}</h2>
      <p>Toque para atirar</p>
      <p>Alpha: {playerPosition?.alpha}</p>
      <p>Beta: {playerPosition?.beta}</p>
      <p>Gamma: {playerPosition?.gamma}</p>
      <button onClick={handleConfirmPhase}>Confirmar Próxima Fase</button>
    </div>
  );
};

export default PlayerScreen;
