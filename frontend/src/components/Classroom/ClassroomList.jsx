import React from 'react';
import { 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton, 
  Paper, 
  Box,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import KeyIcon from '@mui/icons-material/Key';
import ClassIcon from '@mui/icons-material/Class';

const ClassroomList = ({ classrooms, onSelectClassroom, selectedClassroom }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <ClassIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Mis Clases
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {classrooms.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
          No perteneces a ninguna clase todavía.
        </Typography>
      ) : (
        <List sx={{ 
          width: '100%', 
          bgcolor: 'background.paper',
          borderRadius: 1,
          overflow: 'hidden'
        }}>
          {classrooms.map((classroom) => (
            <ListItemButton
              key={classroom.id}
              selected={selectedClassroom && selectedClassroom.id === classroom.id}
              onClick={() => onSelectClassroom(classroom)}
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                  borderBottom: 'none'
                },
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  }
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="medium">
                    {classroom.name}
                  </Typography>
                }
                secondary={
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip 
                      icon={<KeyIcon fontSize="small" />}
                      label={classroom.code} 
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                    <Chip 
                      icon={<PersonIcon fontSize="small" />}
                      label={`${classroom.member_count} miembros`} 
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ClassroomList; 