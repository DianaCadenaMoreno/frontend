import React, { useState } from 'react';
import { Box, TextField, Button, Grid, Typography, Paper, Chip, IconButton, Divider } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useDebuggerWebSocket } from '../hooks/useDebuggerWebSocket';

function Debug({ contrast, onDebug, textEditorRef }) {
  const [startLine, setStartLine] = useState('');
  const [endLine, setEndLine] = useState('');
  const [evalExpression, setEvalExpression] = useState('');

  const {
    isConnected,
    debugState,
    uploadFiles,
    startDebug,
    setBreakpoint,
    step,
    stepInto,
    stepOver,
    continueExecution,
    getVariables,
    evaluateExpression,
    stopDebug
  } = useDebuggerWebSocket();

  const handleDebug = async () => {
    if (!textEditorRef?.current) {
      console.error('No hay referencia al editor');
      return;
    }

    const currentFile = textEditorRef.current.getCurrentFileName?.();
    const currentContent = textEditorRef.current.getContent?.();
    
    if (!currentFile) {
      console.error('No hay archivo abierto');
      return;
    }

    if (!currentContent) {
      console.error('No hay contenido en el archivo');
      return;
    }

    const start = parseInt(startLine);
    const end = parseInt(endLine);

    if (isNaN(start) || isNaN(end) || start > end) {
      console.error('Líneas inválidas');
      return;
    }

    // Primero subir los archivos al backend
    const files = {
      [currentFile]: currentContent
    };
    
    uploadFiles(files);

    // Esperar un momento para que se suban los archivos
    setTimeout(() => {
      // Configurar breakpoints en el rango de líneas
      for (let line = start; line <= end; line++) {
        setBreakpoint(currentFile, line);
      }

      // Iniciar depuración
      startDebug(currentFile);
    }, 500);
  };

  const handleEvaluate = () => {
    if (evalExpression.trim()) {
      evaluateExpression(evalExpression);
    }
  };

  const getThemeColors = (contrast) => {
    switch(contrast) {
      case 'high-contrast':
        return {
          background: '#000000',
          surface: '#1a1a1a',
          text: '#ffffff',
          textSecondary: '#858585',
          border: '#404040',
          accent: '#f7ff0fff',
          buttonBg: '#f7ff0fff',
          buttonText: '#000000',
          inputBg: '#1a1a1a'
        };
      case 'blue-contrast':
        return {
          background: '#0d1117',
          surface: '#1a2332',
          text: '#E0E0E0',
          textSecondary: '#7289DA',
          border: '#2C3E50',
          accent: '#4FC3F7',
          buttonBg: '#4FC3F7',
          buttonText: '#000000',
          inputBg: '#1a2332'
        };
      case 'yellow-contrast':
        return {
          background: '#FFFDE7',
          surface: '#FFF9C4',
          text: '#212121',
          textSecondary: '#757575',
          border: '#E0E0E0',
          accent: '#D32F2F',
          buttonBg: '#D32F2F',
          buttonText: '#ffffff',
          inputBg: '#ffffff'
        };
      default:
        return {
          background: '#f5f5f5',
          surface: '#ffffff',
          text: '#000000',
          textSecondary: '#666666',
          border: '#ddd',
          accent: '#1976d2',
          buttonBg: '#1976d2',
          buttonText: '#ffffff',
          inputBg: '#ffffff'
        };
    }
  };

  const themeColors = getThemeColors(contrast);

  return (
    <Box sx={{ 
      overflow: 'auto',
      p: 2,
      backgroundColor: themeColors.background,
      color: themeColors.text,
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Encabezado */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3,
        pb: 2,
        borderBottom: `2px solid ${themeColors.border}`
      }}>
        {/* <BugReportIcon sx={{ mr: 1, color: themeColors.accent, fontSize: 28 }} /> */}
        <Typography variant="h6" sx={{ color: themeColors.text, fontWeight: 600 }}>
          Depurador de Código
        </Typography>
        <Chip 
          label={isConnected ? 'Conectado' : 'Desconectado'}
          color={isConnected ? 'success' : 'error'}
          size="small"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Campo de línea de inicio */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Línea de inicio"
            placeholder="Ej: 1"
            value={startLine}
            onChange={(e) => setStartLine(e.target.value)}
            variant="outlined"
            fullWidth
            type="number"
            inputProps={{ 
              'aria-label': 'Línea de inicio',
              min: 1
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: themeColors.text,
                backgroundColor: themeColors.inputBg,
                '& fieldset': {
                  borderColor: themeColors.border,
                  borderWidth: 2
                },
                '&:hover fieldset': {
                  borderColor: themeColors.accent
                },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.accent,
                  borderWidth: 2
                }
              },
              '& .MuiInputLabel-root': {
                color: themeColors.textSecondary,
                fontWeight: 500,
                '&.Mui-focused': {
                  color: themeColors.accent,
                  fontWeight: 600
                }
              },
              '& .MuiInputBase-input': {
                fontSize: '16px',
                fontWeight: 500
              },
              '& .MuiInputBase-input::placeholder': {
                color: themeColors.textSecondary,
                opacity: 0.7
              }
            }}
          />
        </Grid>

        {/* Campo de línea final */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Línea final"
            placeholder="Ej: 10"
            value={endLine}
            onChange={(e) => setEndLine(e.target.value)}
            variant="outlined"
            fullWidth
            type="number"
            inputProps={{ 
              'aria-label': 'Línea final',
              min: 1
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: themeColors.text,
                backgroundColor: themeColors.inputBg,
                '& fieldset': {
                  borderColor: themeColors.border,
                  borderWidth: 2
                },
                '&:hover fieldset': {
                  borderColor: themeColors.accent
                },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.accent,
                  borderWidth: 2
                }
              },
              '& .MuiInputLabel-root': {
                color: themeColors.textSecondary,
                fontWeight: 500,
                '&.Mui-focused': {
                  color: themeColors.accent,
                  fontWeight: 600
                }
              },
              '& .MuiInputBase-input': {
                fontSize: '16px',
                fontWeight: 500
              },
              '& .MuiInputBase-input::placeholder': {
                color: themeColors.textSecondary,
                opacity: 0.7
              }
            }}
          />
        </Grid>

        {/* Descripción */}
        {/* <Grid item xs={12}>
          <Box sx={{ 
            p: 2, 
            backgroundColor: themeColors.surface,
            borderRadius: 1,
            border: `1px solid ${themeColors.border}`
          }}>
            <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
              <strong>Tip:</strong> Selecciona el rango de líneas que deseas depurar. 
              El depurador analizará el código entre estas líneas y te mostrará información detallada.
            </Typography>
          </Box>
        </Grid> */}

        {/* Botón de inicio */}
        {/* Botón de inicio / Controles de depuración */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {!debugState.isDebugging ? (
              <Button 
                variant="contained" 
                onClick={handleDebug}
                disabled={!startLine || !endLine || !isConnected}
                aria-label="Iniciar depuración" 
                fullWidth
                startIcon={<PlayArrowIcon />}
                sx={{
                  backgroundColor: themeColors.buttonBg,
                  color: themeColors.buttonText,
                  fontWeight: 600,
                  fontSize: '16px',
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: themeColors.buttonBg,
                    filter: 'brightness(0.9)'
                  },
                  '&:disabled': {
                    backgroundColor: themeColors.border,
                    color: themeColors.textSecondary
                  }
                }}
              >
                Iniciar Depuración
              </Button>
            ) : (
              <>
                <IconButton onClick={step} title="Step" sx={{ color: themeColors.accent }}>
                  <NavigateNextIcon />
                </IconButton>
                <IconButton onClick={stepInto} title="Step Into" sx={{ color: themeColors.accent }}>
                  <ArrowForwardIcon />
                </IconButton>
                <IconButton onClick={stepOver} title="Step Over" sx={{ color: themeColors.accent }}>
                  <SkipNextIcon />
                </IconButton>
                <IconButton onClick={continueExecution} title="Continue" sx={{ color: themeColors.accent }}>
                  <PlayArrowIcon />
                </IconButton>
                <IconButton onClick={getVariables} title="Actualizar Variables" sx={{ color: themeColors.accent }}>
                  <RefreshIcon />
                </IconButton>
                <Button 
                  variant="outlined"
                  onClick={stopDebug}
                  startIcon={<StopIcon />}
                  sx={{ 
                    color: themeColors.accent,
                    borderColor: themeColors.accent,
                    '&:hover': { 
                      borderColor: themeColors.accent, 
                      backgroundColor: 'rgba(255,0,0,0.1)' 
                    }
                  }}
                >
                  Detener
                </Button>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
      {/* Estado actual */}
      {debugState.isDebugging && (
        <Paper sx={{ p: 2, backgroundColor: themeColors.surface, mt: 2 }}>
          <Typography variant="subtitle2" sx={{ color: themeColors.accent, mb: 1, fontWeight: 600 }}>
            Estado Actual
          </Typography>
          <Typography variant="body2" sx={{ color: themeColors.text }}>
            Archivo: {debugState.currentFile || 'N/A'}
          </Typography>
          <Typography variant="body2" sx={{ color: themeColors.text }}>
            Línea: {debugState.currentLine || 'N/A'}
          </Typography>
        </Paper>
      )}

      {/* Variables */}
      {Object.keys(debugState.variables).length > 0 && (
        <Paper sx={{ p: 2, backgroundColor: themeColors.surface, mt: 2 }}>
          <Typography variant="subtitle2" sx={{ color: themeColors.accent, mb: 1, fontWeight: 600 }}>
            Variables
          </Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            {Object.entries(debugState.variables).map(([name, info]) => (
              <Box key={name} sx={{ mb: 1, p: 1, backgroundColor: themeColors.inputBg, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: themeColors.text }}>
                  <strong>{name}</strong> ({info.type}): {info.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Evaluador de expresiones */}
      {debugState.isDebugging && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ my: 2, borderColor: themeColors.border }} />
          <Typography variant="subtitle2" sx={{ color: themeColors.accent, mb: 2, fontWeight: 600 }}>
            Evaluador de Expresiones
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Evaluar expresión"
                placeholder="Ej: x + y"
                value={evalExpression}
                onChange={(e) => setEvalExpression(e.target.value)}
                variant="outlined"
                fullWidth
                onKeyPress={(e) => e.key === 'Enter' && handleEvaluate()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: themeColors.text,
                    backgroundColor: themeColors.inputBg,
                    '& fieldset': { borderColor: themeColors.border }
                  },
                  '& .MuiInputLabel-root': { color: themeColors.textSecondary }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                variant="contained"
                onClick={handleEvaluate}
                disabled={!evalExpression.trim()}
                fullWidth
                sx={{ 
                  height: '100%',
                  backgroundColor: themeColors.buttonBg,
                  color: themeColors.buttonText
                }}
              >
                Evaluar
              </Button>
            </Grid>
          </Grid>
          
          {debugState.lastEvaluation && (
            <Paper sx={{ p: 2, mt: 2, backgroundColor: themeColors.surface }}>
              <Typography variant="body2" sx={{ color: themeColors.text }}>
                <strong>{debugState.lastEvaluation.expression}</strong> = {debugState.lastEvaluation.result}
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Errores */}
      {debugState.error && (
        <Paper sx={{ p: 2, mt: 2, backgroundColor: '#ffebee' }}>
          <Typography variant="body2" sx={{ color: '#c62828', fontWeight: 500 }}>
            ⚠️ Error: {debugState.error}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default Debug;