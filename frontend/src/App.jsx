import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login/LoginForm';
import Register from './components/Register/RegisterForm';
import Transacciones from './pages/Transacciones';
import Classroom from './pages/Classroom';
import Portfolio from './pages/Portfolio';
import Dashboard from './pages/Dashboard';
import News from './pages/News';
import LandingPage from './pages/LandingPage';
import Layout from './components/Layout/Layout';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

//comprueba si el usuario ha iniciado sesión
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/portfolio" element={
            <ProtectedRoute>
              <Layout>
                <Portfolio />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/transacciones" element={
            <ProtectedRoute>
              <Layout>
                <Transacciones />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/classroom" element={
            <ProtectedRoute>
              <Layout>
                <Classroom />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/news" element={
            <ProtectedRoute>
              <Layout>
                <News />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={
            <Navigate to="/dashboard" replace />
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
