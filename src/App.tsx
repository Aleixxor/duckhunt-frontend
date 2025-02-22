import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Room from './Room';
import HostScreen from './HostScreen';
import PlayerScreen from './PlayerScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/host/:roomId" element={<HostScreen />} />
        <Route path="/player/:roomId" element={<PlayerScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
