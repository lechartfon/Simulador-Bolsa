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
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../LanguageSelector';

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
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);

  // Links del menú
  const menuItems = [
    { nameKey: 'menu.dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { nameKey: 'menu.portfolio', path: '/portfolio', icon: <ShowChartIcon /> },
    { nameKey: 'menu.transactions', path: '/transacciones', icon: <AccountBalanceWalletIcon /> },
    { nameKey: 'menu.classroom', path: '/classroom', icon: <ClassIcon /> },
    { nameKey: 'menu.news', path: '/news', icon: <NewspaperIcon /> },
  ];

  // Actualizar título según la página actual
  useEffect(() => {
    const currentPage = menuItems.find(item => item.path === location.pathname);
    if (currentPage) {
      setPageTitle(t(currentPage.nameKey));
    } else {
      setPageTitle(t('brand'));
    }
  }, [location.pathname, t]);
  
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
      console.error(t('layout.balanceError'), error);
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
          {t('brand')}
        </Typography>
      </Box>
      
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.nameKey} 
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
            <ListItemText primary={t(item.nameKey)} />
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
          <ListItemText primary={t('layout.logout')} />
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
              label={isMobile ? `${walletBalance.toFixed(0)}€` : t('layout.balance', { amount: walletBalance.toFixed(2) })}
              variant="filled"
              sx={{ 
                color: 'white', 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          )}
          <LanguageSelector />
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