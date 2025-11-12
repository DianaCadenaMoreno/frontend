import React from 'react';
import { Box, IconButton } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ContrastIcon from '@mui/icons-material/Contrast';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useScreenReader } from '../contexts/ScreenReaderContext';

function Zoom({ children, scale, setScale, contrast, setContrast, magnifierEnabled }) {
  const { enabled: screenReaderEnabled, toggle: toggleScreenReader } = useScreenReader();
  
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

  return (
    <Box sx={{ 
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Box
        id="capture-area"
        sx={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundColor: contrast === 'high-contrast' ? '#1e1e1e' : '#fff',
          color: contrast === 'high-contrast' ? '#fff' : '#1e1e1e',
          height: `${100 / scale}vh`,
          width: `${100 / scale}vw`,
          transition: 'background-color 0.3s, color 0.3s, transform 0.2s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>

      {/* Controles de zoom y contraste */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: contrast === 'high-contrast' ? '#333' : '#fff',
          borderRadius: '8px',
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
          padding: '4px',
          zIndex: 9999
        }}
      >
        <IconButton 
          onClick={handleZoomOut}
          aria-label="Reducir zoom"
          sx={{ 
            color: contrast === 'high-contrast' ? '#fff' : '#000',
            '&:hover': {
              backgroundColor: contrast === 'high-contrast' ? '#555' : '#f0f0f0'
            }
          }}
        >
          <ZoomOutIcon />
        </IconButton>
        
        <IconButton 
          onClick={handleZoomIn}
          aria-label="Aumentar zoom"
          sx={{ 
            color: contrast === 'high-contrast' ? '#fff' : '#000',
            '&:hover': {
              backgroundColor: contrast === 'high-contrast' ? '#555' : '#f0f0f0'
            }
          }}
        >
          <ZoomInIcon />
        </IconButton>
        
        <IconButton 
          onClick={toggleContrast}
          aria-label="Alternar contraste"
          sx={{ 
            color: contrast === 'high-contrast' ? '#fff' : '#000',
            '&:hover': {
              backgroundColor: contrast === 'high-contrast' ? '#555' : '#f0f0f0'
            }
          }}
        >
          <ContrastIcon />
        </IconButton>
        
        <IconButton 
          onClick={toggleScreenReader}
          aria-label={screenReaderEnabled ? "Desactivar lector de pantalla y notificaciones" : "Activar lector de pantalla y notificaciones"}
          sx={{ 
            color: contrast === 'high-contrast' ? '#fff' : '#000',
            '&:hover': {
              backgroundColor: contrast === 'high-contrast' ? '#555' : '#f0f0f0'
            }
          }}
        >
          {screenReaderEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>
      </Box>
    </Box>
  );
}

export default Zoom;