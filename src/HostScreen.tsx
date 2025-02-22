import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { database, ref, set, onValue, onChildAdded, remove, update } from './firebase';

type Duck = {
  id: string;
  x: number; // valor entre 0 e 100 (porcentagem da largura)
  y: number; // valor entre 0 e 100 (porcentagem da altura)
  alive: boolean;
};

type Player = {
  id: string;
  score: number;
  confirmed: boolean;
};

const HostScreen = () => {
  const { roomId } = useParams();
  const [ducks, setDucks] = useState<{ [id: string]: Duck }>({});
  const [players, setPlayers] = useState<{ [id: string]: Player }>({});
  const [phaseEnded, setPhaseEnded] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Função para iniciar (ou reiniciar) a fase
  const startPhase = () => {
    setPhaseEnded(false);
    // Cria 5 patos com posições aleatórias e y = 0
    const newDucks: { [id: string]: Duck } = {};
    for (let i = 0; i < 5; i++) {
      const duckId = `${Date.now()}-${i}`;
      newDucks[duckId] = {
        id: duckId,
        x: Math.random() * 100,
        y: 0,
        alive: true,
      };
    }
    setDucks(newDucks);
    // Atualiza no Firebase
    set(ref(database, `rooms/${roomId}/ducks`), newDucks);
    set(ref(database, `rooms/${roomId}/gameState`), 'playing');
  };

  // Ouve alterações na lista de jogadores
  useEffect(() => {
    const playersRef = ref(database, `rooms/${roomId}/players`);
    onValue(playersRef, snapshot => {
      const data = snapshot.val() || {};
      setPlayers(data);
    });
  }, [roomId]);

  // Processa os tiros enviados pelos jogadores
  useEffect(() => {
    const shotsRef = ref(database, `rooms/${roomId}/shots`);
    onChildAdded(shotsRef, (snapshot) => {
      const shot = snapshot.val();
      const shotKey = snapshot.key;
      // Verifica se algum pato foi atingido
      setDucks(prevDucks => {
        const updatedDucks = { ...prevDucks };
        Object.keys(updatedDucks).forEach(duckId => {
          const duck = updatedDucks[duckId];
          if (duck.alive && Math.abs(duck.x - shot.orientation) < 10) {
            // Pato atingido: marca como morto
            duck.alive = false;
            // Atualiza pontuação do jogador no Firebase
            const playerRef = ref(database, `rooms/${roomId}/players/${shot.playerId}`);
            if (players[shot.playerId]) {
              const newScore = players[shot.playerId].score + 1;
              update(playerRef, { score: newScore });
            }
          }
        });
        // Atualiza os patos no Firebase
        set(ref(database, `rooms/${roomId}/ducks`), updatedDucks);
        return updatedDucks;
      });
      // Remove o tiro para evitar reprocessamento
      remove(ref(database, `rooms/${roomId}/shots/${shotKey}`));
    });
  }, [roomId, players]);

  // Animação simples: move os patos para baixo
  useEffect(() => {
    const interval = setInterval(() => {
      setDucks(prevDucks => {
        const updatedDucks = { ...prevDucks };
        let allDead = true;
        Object.keys(updatedDucks).forEach(duckId => {
          const duck = updatedDucks[duckId];
          if (duck.alive) {
            allDead = false;
            let newY = duck.y + 1;
            if (newY > 100) newY = 0;
            duck.y = newY;
          }
        });
        // Atualiza a posição dos patos no Firebase
        set(ref(database, `rooms/${roomId}/ducks`), updatedDucks);
        // Se todos os patos foram abatidos, encerra a fase
        if (allDead && Object.keys(updatedDucks).length > 0) {
          setPhaseEnded(true);
          set(ref(database, `rooms/${roomId}/gameState`), 'phaseEnded');
        }
        return updatedDucks;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [roomId]);

  // Remove um jogador (ação do host)
  const handleRemovePlayer = (playerId: string) => {
    remove(ref(database, `rooms/${roomId}/players/${playerId}`));
  };

  // Inicia a próxima fase: reinicia os patos e reseta a confirmação dos jogadores
  const handleStartNextPhase = () => {
    // Reinicia a fase
    startPhase();
    // Reseta o flag "confirmed" para cada jogador
    Object.keys(players).forEach(playerId => {
      update(ref(database, `rooms/${roomId}/players/${playerId}`), { confirmed: false });
    });
  };

  // Ao montar, inicia a fase (se ainda não foi iniciada)
  useEffect(() => {
    startPhase();
  }, [roomId]);

  return (
    <div>
      <h2>Host - Sala {roomId}</h2>
      <div
        ref={gameAreaRef}
        style={{ position: 'relative', width: '100%', height: '400px', background: '#def' }}
      >
        {Object.values(ducks).map(duck =>
          duck.alive && (
            <div
              key={duck.id}
              style={{
                position: 'absolute',
                top: `${duck.y}%`,
                left: `${duck.x}%`,
                width: '30px',
                height: '30px',
                background: 'yellow',
                borderRadius: '50%',
              }}
            >
              {/* Aqui você pode substituir por uma imagem do pato */}
            </div>
          )
        )}
      </div>
      <h3>Jogadores</h3>
      <ul>
        {Object.values(players).map(player => (
          <li key={player.id}>
            {player.id} - Pontos: {player.score} {player.confirmed && '(Confirmou)'}
            <button onClick={() => handleRemovePlayer(player.id)}>Remover</button>
          </li>
        ))}
      </ul>
      {phaseEnded && (
        <div>
          <h3>Fase Encerrada!</h3>
          <button onClick={handleStartNextPhase}>Iniciar Próxima Fase</button>
        </div>
      )}
    </div>
  );
};

export default HostScreen;
