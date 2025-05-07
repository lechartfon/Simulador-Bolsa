import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/LoginForm'
import Register from './components/Register/RegisterForm';
import Transacciones from './pages/Transacciones';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Transacciones" element={<Transacciones />} />
      </Routes>
    </Router>
  );
}

export default App;
