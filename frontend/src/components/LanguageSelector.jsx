import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, MenuItem } from '@mui/material';

const LanguageSelector = ({ light = true }) => {
  const { i18n } = useTranslation();

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <Select
      value={i18n.language}
      onChange={handleChange}
      size="small"
      variant="outlined"
      sx={{
        ml: 1,
        color: light ? 'white' : 'inherit',
        fontSize: '0.875rem',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: light ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.23)',
        },
        '& .MuiSvgIcon-root': {
          color: light ? 'white' : 'inherit',
        },
      }}
    >
      <MenuItem value="es">ES</MenuItem>
      <MenuItem value="en">EN</MenuItem>
    </Select>
  );
};

export default LanguageSelector;
