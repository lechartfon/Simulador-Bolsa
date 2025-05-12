import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/LoginForm'
import Register from './components/Register/RegisterForm';
import Transacciones from './pages/Transacciones';
import Classroom from './pages/Classroom';
import Portfolio from './pages/Portfolio';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Transacciones" element={<Transacciones />} />
        <Route path="/classroom" element={<Classroom />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
