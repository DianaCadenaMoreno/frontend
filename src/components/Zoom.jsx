import React from 'react';
import { Box, IconButton } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ContrastIcon from '@mui/icons-material/Contrast';
// import Magnifier from './Magnifier';

function Zoom({ children, scale, setScale, contrast, setContrast, magnifierEnabled }) {
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
    <Box>
      <Box
        id="capture-area"
        sx={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundColor: contrast === 'high-contrast' ? '#1e1e1e' : '#fff',
          color: contrast === 'high-contrast' ? '#fff' : '#1e1e1e',
          border: '1px solid #ddd',
          height: '100%',
          width: '100%',
          transition: 'background-color 0.3s, color 0.3s',
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
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <IconButton onClick={handleZoomOut}>
          <ZoomOutIcon />
        </IconButton>
        <IconButton onClick={handleZoomIn}>
          <ZoomInIcon />
        </IconButton>
        <IconButton onClick={toggleContrast}>
          <ContrastIcon />
        </IconButton>
      </Box>

      {/* Componente de lupa */}
      {/* <Magnifier enabled={magnifierEnabled} scale={2} /> */}
    </Box>
  );
}

export default Zoom;