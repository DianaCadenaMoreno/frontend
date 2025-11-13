import React, { useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Box, Modal, Typography, IconButton, Switch, Slider, Divider } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ContrastIcon from '@mui/icons-material/Contrast';
import SearchIcon from '@mui/icons-material/Search';
import MouseIcon from '@mui/icons-material/Mouse';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import CloseIcon from '@mui/icons-material/Close';
import { useScreenReader } from '../contexts/ScreenReaderContext';
import { useAppNavigation } from '../contexts/NavigationContext';

const AppearanceModal = forwardRef(({ 
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
}, ref) => {
  const { speak, speakOnFocus } = useScreenReader();
  const { registerComponent, unregisterComponent } = useAppNavigation();

  // Registrar componente para navegación
  useEffect(() => {
    if (open) {
      registerComponent('appearance-modal', {
        focus: () => {
          const firstControl = document.querySelector('[data-appearance-control="zoom-out"]');
          if (firstControl) {
            firstControl.focus();
            speakOnFocus('Modal de configuración de apariencia. Usa Tab para navegar entre controles, Escape para cerrar, o Alt+M para desactivar la lupa');
          }
        }
      });
    }

    return () => {
      unregisterComponent('appearance-modal');
    };
  }, [open, registerComponent, unregisterComponent, speakOnFocus]);

  // Exponer métodos del componente
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (open) {
        const firstControl = document.querySelector('[data-appearance-control="zoom-out"]');
        if (firstControl) {
          firstControl.focus();
        }
      }
    }
  }));

  const handleZoomIn = useCallback(() => {
    setScale((prevScale) => {
      const newScale = Math.min(prevScale + 0.1, 3);
      speak(`Zoom aumentado a ${Math.round(newScale * 100)} por ciento`);
      return newScale;
    });
  }, [setScale, speak]);

  const handleZoomOut = useCallback(() => {
    setScale((prevScale) => {
      const newScale = Math.max(prevScale - 0.1, 1);
      speak(`Zoom reducido a ${Math.round(newScale * 100)} por ciento`);
      return newScale;
    });
  }, [setScale, speak]);

  const toggleContrast = useCallback(() => {
    setContrast((prevContrast) => {
      const contrastOptions = ['normal', 'high-contrast', 'blue-contrast', 'yellow-contrast'];
      const currentIndex = contrastOptions.indexOf(prevContrast);
      const nextIndex = (currentIndex + 1) % contrastOptions.length;
      const nextContrast = contrastOptions[nextIndex];
      
      const labels = {
        'normal': 'Normal',
        'high-contrast': 'Alto Contraste',
        'blue-contrast': 'Contraste Azul',
        'yellow-contrast': 'Contraste Amarillo'
      };
      
      speak(`Contraste cambiado a ${labels[nextContrast]}`);
      return nextContrast;
    });
  }, [setContrast, speak]);

  const toggleMagnifier = useCallback(() => {
    setMagnifierEnabled((prevState) => {
      const newState = !prevState;
      speak(newState ? 'Lupa activada. Presiona Escape para desactivar' : 'Lupa desactivada');
      return newState;
    });
  }, [setMagnifierEnabled, speak]);

  const getContrastLabel = () => {
    switch(contrast) {
      case 'high-contrast': return 'Alto Contraste';
      case 'blue-contrast': return 'Contraste Azul';
      case 'yellow-contrast': return 'Contraste Amarillo';
      default: return 'Normal';
    }
  };

  const modalBgColor = contrast === 'high-contrast' ? '#1e1e1e' : 
                      contrast === 'blue-contrast' ? '#1a237e' :
                      contrast === 'yellow-contrast' ? '#f57f17' : 'background.paper';
  
  const textColor = contrast === 'high-contrast' ? 'white' : 
                   contrast === 'blue-contrast' ? 'white' :
                   contrast === 'yellow-contrast' ? 'black' : 'black';

  // Manejador de teclado para el modal
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      // ESC para cerrar modal
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        speak('Modal de apariencia cerrado');
        return;
      }

      // Alt + M para toggle magnifier
      if (event.altKey && (event.key === 'm' || event.key === 'M')) {
        event.preventDefault();
        toggleMagnifier();
        return;
      }

      // Alt + C para toggle contrast
      if (event.altKey && (event.key === 'c' || event.key === 'C')) {
        event.preventDefault();
        toggleContrast();
        return;
      }

      // Alt + Plus/Minus para zoom
      if (event.altKey && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        handleZoomIn();
        return;
      }

      if (event.altKey && (event.key === '-' || event.key === '_')) {
        event.preventDefault();
        handleZoomOut();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose, toggleMagnifier, toggleContrast, handleZoomIn, handleZoomOut, speak]);

  // Manejador global para ESC en toda la aplicación (desactivar lupa)
  useEffect(() => {
    const handleGlobalEscape = (event) => {
      if (event.key === 'Escape' && magnifierEnabled && !open) {
        event.preventDefault();
        setMagnifierEnabled(false);
        speak('Lupa desactivada');
      }
    };

    window.addEventListener('keydown', handleGlobalEscape);
    return () => window.removeEventListener('keydown', handleGlobalEscape);
  }, [magnifierEnabled, open, setMagnifierEnabled, speak]);

  return (
    <Modal 
      open={open} 
      onClose={handleClose}
      aria-labelledby="appearance-modal-title"
      aria-describedby="appearance-modal-description"
    >
      <Box sx={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: modalBgColor,
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          width: 600,
          maxHeight: '85vh',
          overflowY: 'auto'
        }}>
        {/* Header con botón cerrar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography id="appearance-modal-title" variant="h6" sx={{ color: textColor }}>
            Configuración de Apariencia
          </Typography>
          <IconButton 
            onClick={handleClose}
            sx={{ color: textColor }}
            aria-label="Cerrar modal"
            onFocus={() => speakOnFocus('Botón cerrar modal')}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* <Divider sx={{ mb: 3, borderColor: textColor, opacity: 0.3 }} /> */}

        {/* Atajos de teclado */}
        {/* <Box sx={{ mb: 3, p: 2, bgcolor: textColor === 'white' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
          <Typography sx={{ color: textColor, mb: 1, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            <KeyboardIcon sx={{ mr: 1 }} />
            Atajos de Teclado
          </Typography>
          <Typography variant="body2" sx={{ color: textColor, opacity: 0.9, ml: 4 }}>
            • <strong>Escape:</strong> Cerrar modal / Desactivar lupa<br/>
            • <strong>Alt + M:</strong> Activar/Desactivar lupa<br/>
            • <strong>Alt + C:</strong> Cambiar contraste<br/>
            • <strong>Alt + Plus/Minus:</strong> Ajustar zoom<br/>
            • <strong>Tab:</strong> Navegar entre controles
          </Typography>
        </Box> */}

        {/* Comandos de voz */}
        {/* <Box sx={{ mb: 3, p: 2, bgcolor: textColor === 'white' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
          <Typography sx={{ color: textColor, mb: 1, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            <RecordVoiceOverIcon sx={{ mr: 1 }} />
            Comandos de Voz (siempre escuchando)
          </Typography>
          <Typography variant="body2" sx={{ color: textColor, opacity: 0.9, ml: 4 }}>
            • <strong>"ampliar"</strong> o <strong>"aumentar":</strong> Aumentar zoom<br/>
            • <strong>"reducir"</strong> o <strong>"disminuir":</strong> Reducir zoom<br/>
            • <strong>"contraste":</strong> Cambiar modo de contraste<br/>
            • <strong>"lupa":</strong> Activar/Desactivar lupa
          </Typography>
        </Box> */}

        {/* <Divider sx={{ mb: 3, borderColor: textColor, opacity: 0.3 }} /> */}

        {/* Zoom General */}
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: textColor, mb: 1 }}>
            Zoom General: {Math.round(scale * 100)}%
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={handleZoomOut} 
              sx={{ color: textColor }}
              data-appearance-control="zoom-out"
              aria-label="Reducir zoom"
              onFocus={() => speakOnFocus(`Botón reducir zoom. Zoom actual ${Math.round(scale * 100)} por ciento`)}
            >
              <ZoomOutIcon />
            </IconButton>
            <Slider
              value={scale}
              onChange={(e, newValue) => setScale(newValue)}
              onChangeCommitted={(e, newValue) => speak(`Zoom ajustado a ${Math.round(newValue * 100)} por ciento`)}
              min={1}
              max={3}
              step={0.1}
              sx={{ flex: 1, color: textColor }}
              aria-label="Control deslizante de zoom"
              onFocus={() => speakOnFocus(`Control de zoom. Valor actual ${Math.round(scale * 100)} por ciento`)}
            />
            <IconButton 
              onClick={handleZoomIn} 
              sx={{ color: textColor }}
              aria-label="Aumentar zoom"
              onFocus={() => speakOnFocus(`Botón aumentar zoom. Zoom actual ${Math.round(scale * 100)} por ciento`)}
            >
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
            onChangeCommitted={(e, newValue) => speak(`Tamaño de cursor ajustado a ${newValue} píxeles`)}
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
            aria-label="Control de tamaño de cursor"
            onFocus={() => speakOnFocus(`Control de tamaño de cursor. Valor actual ${cursorSize} píxeles`)}
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
            onChangeCommitted={(e, newValue) => speak(`Tamaño de fuente ajustado a ${newValue} píxeles`)}
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
            aria-label="Control de tamaño de fuente"
            onFocus={() => speakOnFocus(`Control de tamaño de fuente. Valor actual ${fontSize} píxeles`)}
          />
        </Box>

        {/* Contraste */}
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ color: textColor, mb: 1 }}>
            Modo de Contraste: {getContrastLabel()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={toggleContrast} 
              sx={{ color: textColor }}
              aria-label="Cambiar modo de contraste"
              onFocus={() => speakOnFocus(`Botón cambiar contraste. Modo actual: ${getContrastLabel()}`)}
            >
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
            Lupa {magnifierEnabled && '(Presiona ESC para desactivar)'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Switch
              checked={magnifierEnabled}
              onChange={toggleMagnifier}
              color="primary"
              aria-label="Activar o desactivar lupa"
              onFocus={() => speakOnFocus(`Interruptor de lupa. Estado actual: ${magnifierEnabled ? 'Activada' : 'Desactivada'}`)}
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
                  onChangeCommitted={(e, newValue) => speak(`Tamaño de lupa ajustado a ${newValue} píxeles`)}
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
                  aria-label="Control de tamaño de lupa"
                  onFocus={() => speakOnFocus(`Control de tamaño de lupa. Valor actual ${magnifierSize} píxeles`)}
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
                  onChangeCommitted={(e, newValue) => speak(`Zoom de lupa ajustado a ${newValue} por`)}
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
                  aria-label="Control de zoom de lupa"
                  onFocus={() => speakOnFocus(`Control de zoom de lupa. Valor actual ${magnifierZoom} por`)}
                />
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Modal>
  );
});

AppearanceModal.displayName = 'AppearanceModal';

export default AppearanceModal;