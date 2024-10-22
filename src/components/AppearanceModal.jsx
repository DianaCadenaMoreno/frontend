import React from 'react';
import { Box, Modal, Typography, IconButton, Switch } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ContrastIcon from '@mui/icons-material/Contrast';
import SearchIcon from '@mui/icons-material/Search';

function AppearanceModal({ open, handleClose, scale, setScale, contrast, setContrast, magnifierEnabled, setMagnifierEnabled }) {
  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 1));
  };

  const toggleContrast = () => {
    setContrast((prevContrast) =>
      prevContrast === 'normal' ? 'high-contrast' : 'normal'
    );
  };

  const modalBgColor = contrast === 'high-contrast' ? '#1e1e1e' : 'background.paper';
  const textColor = contrast === 'high-contrast' ? 'white' : 'black';

  const toggleMagnifier = () => {
    setMagnifierEnabled((prevState) => !prevState);
    handleClose(); // Cierra el modal después de activar/desactivar la lupa
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: modalBgColor,
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          width: 400,
        }}>
        <Typography variant="h6" sx={{ color: textColor }}>Apariencia</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: textColor }}>Zoom</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleZoomOut} sx={{ color: textColor }}>
              <ZoomOutIcon />
            </IconButton>
            <IconButton onClick={handleZoomIn} sx={{ color: textColor }}>
              <ZoomInIcon />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: textColor }}>Contraste</Typography>
          <IconButton onClick={toggleContrast} sx={{ color: textColor }}>
            <ContrastIcon />
          </IconButton>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: textColor }}>Activar Lupa</Typography>  
          <Switch
            checked={magnifierEnabled}
            onChange={toggleMagnifier}
            color="primary"
          />
          <SearchIcon sx={{ color: textColor }}/>
        </Box>
      </Box>
    </Modal>
  );
}

export default AppearanceModal;
