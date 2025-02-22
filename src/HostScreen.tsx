import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000'); // No deploy, atualize para a URL do backend

type Duck = {
  id: string;
  x: number; // posição horizontal em porcentagem (0 a 100)
  y: number; // posição vertical em porcentagem (0 a 100)
  alive: boolean;
};

type Player = {
  id: string;
  score: number;
  confirmed: boolean;
};

const HostScreen = () => {
  const { roomId } = useParams();
  const [ducks, setDucks] = useState<Duck[]>([]);
  const [players, setPlayers] = useState<{ [key: string]: Player }>({});
  const [phaseEnded, setPhaseEnded] = useState(false);
  const [confirmCount, setConfirmCount] = useState(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Função para iniciar uma nova fase
  const startPhase = () => {
    setPhaseEnded(false);
    setConfirmCount(0);
    // Reseta a confirmação de todos os players
    setPlayers(prev => {
      const novos = { ...prev };
      Object.keys(novos).forEach(id => novos[id].confirmed = false);
      return novos;
    });
    // Cria 5 patos com posições aleatórias
    const novosPatos: Duck[] = [];
    for (let i = 0; i < 5; i++) {
      novosPatos.push({
        id: `${Date.now()}-${i}`,
        x: Math.random() * 100,
        y: 0,
        alive: true
      });
    }
    setDucks(novosPatos);
  };

  // Animação simples: move os patos para baixo
  useEffect(() => {
    const interval = setInterval(() => {
      setDucks(prev =>
        prev.map(duck => {
          if (!duck.alive) return duck;
          let newY = duck.y + 1;
          if (newY > 100) newY = 0;
          return { ...duck, y: newY };
        })
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.emit('joinRoom', { roomId, isHost: true });
    socket.on('shoot', (data: { playerId: string; orientation: number }) => {
      // data.orientation: valor entre 0 e 100 representando a posição horizontal
      setDucks(prevDucks =>
        prevDucks.map(duck => {
          if (duck.alive && Math.abs(duck.x - data.orientation) < 10) {
            // Pato atingido – aumenta pontos do player
            setPlayers(prevPlayers => {
              const atualizados = { ...prevPlayers };
              if (atualizados[data.playerId]) {
                atualizados[data.playerId].score += 1;
              } else {
                atualizados[data.playerId] = { id: data.playerId, score: 1, confirmed: false };
              }
              return atualizados;
            });
            return { ...duck, alive: false };
          }
          return duck;
        })
      );
    });

    socket.on('playerJoined', (data: { playerId: string }) => {
      setPlayers(prev => ({ ...prev, [data.playerId]: { id: data.playerId, score: 0, confirmed: false } }));
    });

    socket.on('phaseConfirmed', (data: { playerId: string }) => {
      setPlayers(prev => {
        const atualizados = { ...prev };
        if (atualizados[data.playerId] && !atualizados[data.playerId].confirmed) {
          atualizados[data.playerId].confirmed = true;
          setConfirmCount(c => c + 1);
        }
        return atualizados;
      });
    });

    return () => {
      socket.off('shoot');
      socket.off('playerJoined');
      socket.off('phaseConfirmed');
    };
  }, [roomId]);

  // Verifica se a fase terminou (todos os patos foram atingidos)
  useEffect(() => {
    if (ducks.every(duck => !duck.alive)) {
      setPhaseEnded(true);
    }
  }, [ducks]);

  const handleStartNextPhase = () => {
    socket.emit('startNextPhase', { roomId });
    startPhase();
  };

  const handleRemovePlayer = (playerId: string) => {
    socket.emit('removePlayer', { roomId, playerId });
    setPlayers(prev => {
      const atualizados = { ...prev };
      delete atualizados[playerId];
      return atualizados;
    });
  };

  return (
    <div>
      <h2>Host - Sala {roomId}</h2>
      <div
        ref={gameAreaRef}
        style={{ position: 'relative', width: '100%', height: '400px', background: '#def' }}
      >
        {ducks.map((duck) =>
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
                borderRadius: '50%'
              }}
            >
              {/* Aqui você pode colocar uma imagem do pato */}
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
          <p>Confirmaram: {confirmCount} jogadores</p>
          <button onClick={handleStartNextPhase}>Iniciar Próxima Fase</button>
        </div>
      )}
    </div>
  );
};

export default HostScreen;
