import React, { useState } from 'react';
import { Box, Button } from '@mui/material';

function Contrast({ children }) {
  const [contrast, setContrast] = useState('normal');

  const toggleContrast = () => {
    setContrast((prevContrast) => 
      prevContrast === 'normal' ? 'high-contrast' : 'normal'
    );
  };

  return (
    <Box
      sx={{
        backgroundColor: contrast === 'high-contrast' ? '#000' : '#fff',
        color: contrast === 'high-contrast' ? '#fff' : '#000',
        height: '100%',
        width: '100%',
        transition: 'background-color 0.3s, color 0.3s',
      }}
    >
      {children}
      <Button
        onClick={toggleContrast}
        variant="contained"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          backgroundColor: contrast === 'high-contrast' ? '#fff' : '#000',
          color: contrast === 'high-contrast' ? '#000' : '#fff',
        }}
      >
        {contrast === 'high-contrast' ? 'Normal Contrast' : 'High Contrast'}
      </Button>
    </Box>
  );
}

export default Contrast;
