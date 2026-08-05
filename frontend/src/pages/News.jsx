import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  InputAdornment,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { getAllNews, deleteNews } from '../utils/newsService';
import NewsCard from '../components/News/NewsCard';
import FormularioNoticias from '../components/News/NewsForm';
import DeleteConfirmationDialog from '../components/News/DeleteConfirmationDialog';
import Layout from '../components/Layout/Layout';
import { useTranslation } from 'react-i18next';

const News = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Verificar si el usuario es admin@admin
  const userEmail = JSON.parse(localStorage.getItem('user'))?.email || '';
  const isAdmin = userEmail === 'admin@admin';

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllNews();
      setNewsItems(data || []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(t('news.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddNews = () => {
    setEditingNews(null);
    setIsFormOpen(true);
  };

  const handleEditNews = (news) => {
    setEditingNews(news);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingNews(null);
  };

  const handleFormSuccess = (updatedNews) => {
    if (updatedNews) {
      if (editingNews) {
        setNewsItems(prevNews => 
          prevNews.map(news => 
            news.id === updatedNews.id ? updatedNews : news
          )
        );
      } else {
        fetchNews();
      }
    } else {
      fetchNews();
    }
  };

  const handleDeleteClick = (newsId) => {
    setNewsToDelete(newsId);
    setDeleteDialogOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!newsToDelete) return;
    
    setIsDeleting(true);
    setError(null); 
    
    try {
      await deleteNews(newsToDelete);
     
      setNewsItems(prevItems => prevItems.filter(item => item.id !== newsToDelete));
    } catch (err) {
      console.error('Error deleting news:', err);
      setError(t('news.deleteError'));
      await fetchNews();
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setNewsToDelete(null);
    }
  };

  const filteredNews = newsItems.filter((news) =>
    news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.content.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('news.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {t('news.subtitle')}
          </Typography>
        </Box>

        <Paper
          sx={{
            p: 2,
            mb: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
          }}
          elevation={1}
        >
          <TextField
            placeholder={t('news.searchPlaceholder')}
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNews}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              {t('news.addNews')}
            </Button>
          )}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredNews.length === 0 ? (
          <Box sx={{ textAlign: 'center', my: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('news.noNews')}
            </Typography>
            {searchTerm && (
              <Typography variant="body2" color="text.secondary">
                {t('news.noResults', { searchTerm })}
              </Typography>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredNews.map((news) => (
              <Grid item xs={12} sm={6} md={4} key={news.id}>
                <NewsCard
                  news={news}
                  isAdmin={isAdmin}
                  onEdit={handleEditNews}
                  onDelete={handleDeleteClick}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {isAdmin && isMobile && (
          <Fab
            color="primary"
            aria-label="add"
            onClick={handleAddNews}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
            }}
          >
            <AddIcon />
          </Fab>
        )}      </Container>

      <FormularioNoticias
        open={isFormOpen}
        onClose={handleCloseForm}
        initialData={editingNews}
        onSuccess={handleFormSuccess}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default News; 