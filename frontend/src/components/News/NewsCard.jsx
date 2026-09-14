import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, CardActions, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const StyledCard = styled(Card)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const StyledMedia = styled(CardMedia)(() => ({
  height: 200,
  backgroundSize: 'cover',
}));

const StyledContent = styled(CardContent)(() => ({
  flexGrow: 1,
}));

const TruncatedText = styled(Typography)(() => ({
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const NewsCard = ({ news, isAdmin, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();
  const handleReadMore = () => {
    if (isHttpUrl(news.url)) {
      window.open(news.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : 'es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <StyledCard elevation={3}>
      {news.image_url && isHttpUrl(news.image_url) && (
        <StyledMedia image={news.image_url} title={news.title} role="img" aria-label={news.title} />
      )}
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
        <Button size="small" color="primary" onClick={handleReadMore} disabled={!isHttpUrl(news.url)}>
          {t('newsCard.readMore')}
        </Button>
        {isAdmin && (
          <Box>
            <Button size="small" color="primary" onClick={() => onEdit(news)} sx={{ mr: 1 }}>
              {t('newsCard.edit')}
            </Button>
            <Button size="small" color="error" onClick={() => onDelete(news.id)}>
              {t('newsCard.delete')}
            </Button>
          </Box>
        )}
      </CardActions>
    </StyledCard>
  );
};

export default NewsCard;
