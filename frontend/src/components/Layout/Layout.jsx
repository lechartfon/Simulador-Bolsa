import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button, IconButton, Container } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ClassIcon from '@mui/icons-material/Class';
import NewspaperIcon from '@mui/icons-material/Newspaper';

const Layout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Simulador Bolsa
          </Typography>
          <Button 
            color="inherit" 
            component={Link} 
            to="/dashboard" 
            sx={{ mx: 0.5 }}
          >
            Dashboard
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/portfolio" 
            startIcon={<ShowChartIcon />}
            sx={{ mx: 0.5 }}
          >
            Portfolio
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/Transacciones" 
            startIcon={<AccountBalanceWalletIcon />}
            sx={{ mx: 0.5 }}
          >
            Transacciones
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/classroom" 
            startIcon={<ClassIcon />}
            sx={{ mx: 0.5 }}
          >
            Classroom
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/news" 
            startIcon={<NewspaperIcon />}
            sx={{ mx: 0.5 }}
          >
            Noticias
          </Button>
          <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 