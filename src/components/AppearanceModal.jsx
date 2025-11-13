import React from 'react';
import { Box, Modal, Typography, IconButton, Switch, Slider, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ContrastIcon from '@mui/icons-material/Contrast';
import SearchIcon from '@mui/icons-material/Search';
import MouseIcon from '@mui/icons-material/Mouse';
import FormatSizeIcon from '@mui/icons-material/FormatSize';

function AppearanceModal({ 
  open, 
  handleClose, 
  scale, 
  setScale, 
  contrast, 
  setContrast, 
  magnifierEnabled, 
  setMagnifierEnabled,
  cursorSize,
  setCursorSize,
  fontSize,
  setFontSize,
  magnifierSize,
  setMagnifierSize,
  magnifierZoom,
  setMagnifierZoom
}) {
  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 1));
  };

  const toggleContrast = () => {
    setContrast((prevContrast) => {
      const contrastOptions = ['normal', 'high-contrast', 'blue-contrast', 'yellow-contrast'];
      const currentIndex = contrastOptions.indexOf(prevContrast);
      const nextIndex = (currentIndex + 1) % contrastOptions.length;
      return contrastOptions[nextIndex];
    });
  };

  const modalBgColor = contrast === 'high-contrast' ? '#1e1e1e' : 
                      contrast === 'blue-contrast' ? '#1a237e' :
                      contrast === 'yellow-contrast' ? '#f57f17' : 'background.paper';
  
  const textColor = contrast === 'high-contrast' ? 'white' : 
                   contrast === 'blue-contrast' ? 'white' :
                   contrast === 'yellow-contrast' ? 'black' : 'black';

  const toggleMagnifier = () => {
    setMagnifierEnabled((prevState) => !prevState);
  };

  const getContrastLabel = () => {
    switch(contrast) {
      case 'high-contrast': return 'Alto Contraste';
      case 'blue-contrast': return 'Contraste Azul';
      case 'yellow-contrast': return 'Contraste Amarillo';
      default: return 'Normal';
    }
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
          width: 500,
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
        <Typography variant="h6" sx={{ color: textColor, mb: 3 }}>
          Configuración de Apariencia
        </Typography>

        {/* Zoom General */}
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: textColor, mb: 1 }}>
            Zoom General: {Math.round(scale * 100)}%
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleZoomOut} sx={{ color: textColor }}>
              <ZoomOutIcon />
            </IconButton>
            <Slider
              value={scale}
              onChange={(e, newValue) => setScale(newValue)}
              min={1}
              max={3}
              step={0.1}
              sx={{ flex: 1, color: textColor }}
            />
            <IconButton onClick={handleZoomIn} sx={{ color: textColor }}>
              <ZoomInIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Tamaño del Cursor */}
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ color: textColor, mb: 1 }}>
            <MouseIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Tamaño del Cursor: {cursorSize}px
          </Typography>
          <Slider
            value={cursorSize}
            onChange={(e, newValue) => setCursorSize(newValue)}
            min={16}
            max={64}
            step={4}
            sx={{ 
              color: textColor,
              '& .MuiSlider-markLabel': {
                color: textColor,
                opacity: 0.7
              },
              '& .MuiSlider-mark': {
                backgroundColor: textColor,
                opacity: 0.3
              }
            }}
              marks={[
              { value: 16, label: '16px' },
              { value: 32, label: '32px' },
              { value: 48, label: '48px' },
              { value: 64, label: '64px' }
            ]}
          />
        </Box>

        {/* Tamaño de Fuente */}
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ color: textColor, mb: 1 }}>
            <FormatSizeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Tamaño de Fuente: {fontSize}px
          </Typography>
          <Slider
            value={fontSize}
            onChange={(e, newValue) => setFontSize(newValue)}
            min={12}
            max={24}
            step={1}
            sx={{ 
              color: textColor,
              '& .MuiSlider-markLabel': {
                color: textColor,
                opacity: 0.7
              },
              '& .MuiSlider-mark': {
                backgroundColor: textColor,
                opacity: 0.3
              }
            }}
            marks={[
              { value: 12, label: '12px' },
              { value: 14, label: '14px' },
              { value: 16, label: '16px' },
              { value: 18, label: '18px' },
              { value: 20, label: '20px' },
              { value: 24, label: '24px' }
            ]}
          />
        </Box>

        {/* Contraste */}
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ color: textColor, mb: 1 }}>
            Modo de Contraste: {getContrastLabel()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={toggleContrast} sx={{ color: textColor }}>
              <ContrastIcon />
            </IconButton>
            <Typography variant="body2" sx={{ color: textColor }}>
              Click para cambiar entre modos
            </Typography>
          </Box>
        </Box>

        {/* Lupa */}
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ color: textColor, mb: 1 }}>
            <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Lupa
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Switch
              checked={magnifierEnabled}
              onChange={toggleMagnifier}
              color="primary"
            />
            <Typography sx={{ color: textColor }}>
              {magnifierEnabled ? 'Activada' : 'Desactivada'}
            </Typography>
          </Box>

          {magnifierEnabled && (
            <>
              {/* Tamaño de la Lupa */}
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ color: textColor, mb: 1 }}>
                  Tamaño de la Lupa: {magnifierSize}px
                </Typography>
                <Slider
                  value={magnifierSize}
                  onChange={(e, newValue) => setMagnifierSize(newValue)}
                  min={100}
                  max={400}
                  step={25}
                  sx={{ 
                    color: textColor,
                    '& .MuiSlider-markLabel': {
                      color: textColor,
                      opacity: 0.7
                    },
                    '& .MuiSlider-mark': {
                      backgroundColor: textColor,
                      opacity: 0.3
                    }
                  }}
                  marks={[
                    { value: 100, label: '100px' },
                    { value: 200, label: '200px' },
                    { value: 300, label: '300px' },
                    { value: 400, label: '400px' }
                  ]}
                />
              </Box>

              {/* Zoom de la Lupa */}
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ color: textColor, mb: 1 }}>
                  Zoom de la Lupa: {magnifierZoom}x
                </Typography>
                <Slider
                  value={magnifierZoom}
                  onChange={(e, newValue) => setMagnifierZoom(newValue)}
                  min={1.5}
                  max={5}
                  step={0.5}
                  sx={{ 
                    color: textColor,
                    '& .MuiSlider-markLabel': {
                      color: textColor,
                      opacity: 0.7
                    },
                    '& .MuiSlider-mark': {
                      backgroundColor: textColor,
                      opacity: 0.3
                    }
                  }}
                  marks={[
                    { value: 1.5, label: '1.5x' },
                    { value: 2, label: '2x' },
                    { value: 3, label: '3x' },
                    { value: 4, label: '4x' },
                    { value: 5, label: '5x' }
                  ]}
                />
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Modal>
  );
}

export default AppearanceModal;