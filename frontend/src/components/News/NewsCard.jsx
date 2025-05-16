import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, CardActions, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const StyledMedia = styled(CardMedia)(({ theme }) => ({
  height: 200,
  backgroundSize: 'cover',
}));

const StyledContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
}));

const TruncatedText = styled(Typography)(({ theme }) => ({
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const NewsCard = ({ news, isAdmin, onEdit, onDelete }) => {
  const handleReadMore = () => {
    window.open(news.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <StyledCard elevation={3}>
      <StyledMedia
        image={news.image_url}
        title={news.title}
      />
      <StyledContent>
        <Typography gutterBottom variant="h5" component="div">
          {news.title}
        </Typography>
        <TruncatedText variant="body2" color="text.secondary">
          {news.content}
        </TruncatedText>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          {formatDate(news.created_at)}
        </Typography>
      </StyledContent>
      <CardActions sx={{ justifyContent: 'space-between', pb: 2, px: 2 }}>
        <Button size="small" color="primary" onClick={handleReadMore}>
          Leer más
        </Button>
        {isAdmin && (
          <Box>
            <Button size="small" color="primary" onClick={() => onEdit(news)} sx={{ mr: 1 }}>
              Editar
            </Button>
            <Button size="small" color="error" onClick={() => onDelete(news.id)}>
              Eliminar
            </Button>
          </Box>
        )}
      </CardActions>
    </StyledCard>
  );
};

export default NewsCard; 