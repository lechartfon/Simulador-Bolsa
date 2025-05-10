import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/LoginForm'
import Register from './components/Register/RegisterForm';
import Transacciones from './pages/Transacciones';
import Classroom from './pages/Classroom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Transacciones" element={<Transacciones />} />
        <Route path="/classroom" element={<Classroom />} />
        <Route path="/" element={<Transacciones />} />
      </Routes>
    </Router>
  );
}

export default App;
