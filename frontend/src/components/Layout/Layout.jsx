import React, { useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ClassIcon from '@mui/icons-material/Class';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import axios from 'axios';

const drawerWidth = 240;

window.updateHeaderWallet = () => {
  if (window.fetchWalletBalance) {
    window.fetchWalletBalance();
  }
};

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);

  // Links del menú
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { name: 'Portfolio', path: '/portfolio', icon: <ShowChartIcon /> },
    { name: 'Transacciones', path: '/transacciones', icon: <AccountBalanceWalletIcon /> },
    { name: 'Classroom', path: '/classroom', icon: <ClassIcon /> },
    { name: 'Noticias', path: '/news', icon: <NewspaperIcon /> },
  ];

  // Actualizar título según la página actual
  useEffect(() => {
    const currentPage = menuItems.find(item => item.path === location.pathname);
    if (currentPage) {
      setPageTitle(currentPage.name);
    } else {
      setPageTitle('Simulador Bolsa');
    }
  }, [location.pathname]);
  
  // Obtener saldo
  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get('http://localhost:8000/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.balance) {
        setWalletBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Error al cargar saldo:', error);
    }
  };

  useEffect(() => {
    window.fetchWalletBalance = fetchWalletBalance;
    fetchWalletBalance();
    
    return () => {
      window.fetchWalletBalance = undefined;
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'primary.main',
      color: 'white'
    }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <ShowChartIcon sx={{ mr: 1 }} />
        <Typography variant="h6">
          Simulador Bolsa
        </Typography>
      </Box>
      
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.name} 
            component={Link} 
            to={item.path}
            sx={{ 
              color: 'white',
              bgcolor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            }}
            onClick={isMobile ? handleDrawerToggle : undefined}
          >
            <ListItemIcon sx={{ color: 'white' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <List>
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{ color: 'white' }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <ExitToAppIcon />
          </ListItemIcon>
          <ListItemText primary="Cerrar Sesión" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { md: `calc(100% - ${drawerWidth}px)` }, 
          ml: { md: `${drawerWidth}px` },
          boxShadow: 1
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {pageTitle}
            </Typography>
          </Box>
          {walletBalance !== null && (
            <Chip
              icon={<AccountBalanceWalletIcon />}
              label={isMobile ? `${walletBalance.toFixed(0)}€` : `Saldo: ${walletBalance.toFixed(2)}€`}
              variant="filled"
              sx={{ 
                color: 'white', 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, 
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: theme.palette.primary.main,
            },
          }}
        >
          {drawer}
        </Drawer>
        
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: theme.palette.primary.main,
              borderRight: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          p: 2,
          pt: 10,
          overflow: 'auto'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 