import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

// Atualize o endereço do backend conforme o deploy
const socket = io('http://localhost:4000');

const Room = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const role = location.state?.role || 'player';

  const [messages, setMessages] = useState<Array<{sender: string, message: string}>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userNameAux, setUserNameAux] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Ao entrar na sala, emitimos o join com o papel (host ou player)
    socket.emit('joinRoom', { roomId, isHost: role === 'host' });

    // Recebe mensagens novas
    socket.on('newMessage', (data) => {
        console.log(data);
      setMessages(prev => [...prev, data]);
    });

    // Se o host sair, notificamos os players (opcional)
    socket.on('hostLeft', () => {
      alert('O host saiu da sala.');
      navigate('/');
    });

    return () => {
      socket.off('newMessage');
      socket.off('hostLeft');
    };
  }, [roomId, role, navigate]);

  const sendMessage = () => {
    if(newMessage.trim()){
      socket.emit('sendMessage', { roomId, message: newMessage, sender: role === 'host'? role : userName, role: role });
      setNewMessage('');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Sala: {roomId}</h2>
      
      {role === 'host' && (
        <div style={{ border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
          <h3>Configurações da Sala</h3>
          {/* Aqui você pode colocar configurações específicas para o host */}
          <p>Aqui você pode configurar a sala.</p>
        </div>
      )}

      {!userName && role !== 'host' ? <>
        <div style={{ border: '1px solid gray', overflowY: 'scroll', padding: '10px' }}>
            <label>Digite seu nome:</label>
            <br />
            <input 
                type="text" 
                value={userNameAux} 
                onChange={(e) => setUserNameAux(e.target.value)} 
                placeholder="Digite seu nome" 
            />
            <button onClick={() => setUserName(userNameAux)}>Entrar</button>
        </div>
      </> : <>
        <div style={{ border: '1px solid gray', height: '300px', overflowY: 'scroll', padding: '10px' }}>
            {messages.map((msg, idx) => (
            <div key={idx}>
                <strong>{msg.sender}: </strong>{msg.message}
            </div>
            ))}
        </div>

        <div style={{ marginTop: '10px' }}>
            <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Digite sua mensagem" 
            />
            <button onClick={sendMessage}>Enviar</button>
        </div>
      </> }
    </div>
  );
};

export default Room;
