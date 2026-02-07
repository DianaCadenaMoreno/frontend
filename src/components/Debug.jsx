import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Grid, Typography, Paper, Chip, IconButton, Divider, Alert, AlertTitle } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { useDebuggerWebSocket } from '../hooks/useDebuggerWebSocket';
import { useScreenReader } from '../contexts/ScreenReaderContext';

// function Debug({ contrast, textEditorRef }) {
const Debug = React.forwardRef(({ contrast, textEditorRef }, ref) => {
  const [breakpointLine, setBreakpointLine] = useState('');
  const [manualBreakpoints, setManualBreakpoints] = useState([]);
  const [evalExpression, setEvalExpression] = useState('');

  const {
    isConnected,
    debugState,
    uploadFiles,
    startDebug,
    setBreakpoint,
    setDebugState,
    removeBreakpoint,
    step,
    stepInto,
    stepOver,
    continueExecution,
    getVariables,
    evaluateExpression,
    stopDebug
  } = useDebuggerWebSocket();

  const { speak, speakOnFocus } = useScreenReader();

  // Solicitar variables cada vez que se llega a un breakpoint
  useEffect(() => {
    if (debugState.currentLine && debugState.isDebugging) {
      setTimeout(() => getVariables(), 100);
    }
  }, [debugState.currentLine, debugState.isDebugging, getVariables]);

  // Anunciar cuando se llega o cambia a una nueva línea durante la depuración
  useEffect(() => {
    if (debugState.isDebugging && debugState.currentLine) {
      const fileName = debugState.currentFile || 'archivo actual';
      speak(`Ejecución pausada en ${fileName}, línea ${debugState.currentLine}`);
    }
  }, [debugState.isDebugging, debugState.currentLine, debugState.currentFile, speak]);

  // Anunciar excepciones cuando ocurren
  useEffect(() => {
    if (debugState.exception) {
      const { type, message, file, line } = debugState.exception;
      speak(`Excepción ${type || 'desconocida'} en archivo ${file}, línea ${line}. ${message || ''}`);
    }
  }, [debugState.exception, speak]);

  // Anunciar cuando las variables se actualizan en un breakpoint
  useEffect(() => {
    if (debugState.isDebugging && debugState.variables) {
      speak('Variables actualizadas para la línea actual', { rate: 1.2 });
    }
  }, [debugState.isDebugging, debugState.variables, speak]);

  const handleAddBreakpoint = () => {
    const line = parseInt(breakpointLine);
    if (!isNaN(line) && line > 0 && !manualBreakpoints.includes(line)) {
      setManualBreakpoints([...manualBreakpoints, line].sort((a, b) => a - b));
      setBreakpointLine('');
    }
  };

  const handleRemoveBreakpoint = (line) => {
    setManualBreakpoints(manualBreakpoints.filter(l => l !== line));
  };

  const handleDebug = async () => {
    if (!textEditorRef?.current) {
      console.error('No hay referencia al editor');
      return;
    }

    const currentFile = textEditorRef.current.getCurrentFileName?.();
    const currentContent = textEditorRef.current.getContent?.();
    
    if (!currentFile) {
      console.error('No hay archivo abierto');
      alert('Por favor abre un archivo primero');
      return;
    }

    if (!currentContent || currentContent.trim() === '') {
      console.error('No hay contenido en el archivo');
      alert('El archivo está vacío');
      return;
    }

    if (manualBreakpoints.length === 0) {
      console.error('Debes agregar al menos un breakpoint');
      alert('Debes agregar al menos un breakpoint');
      return;
    }

    // Subir archivos
    const files = {
      [currentFile]: currentContent
    };
    
    console.log('📤 Subiendo archivos...', { file: currentFile, lines: currentContent.split('\n').length });
    uploadFiles(files);

    // Configurar breakpoints después de subir archivos
    setTimeout(() => {
      console.log('🔴 Configurando breakpoints:', manualBreakpoints);
      manualBreakpoints.forEach(line => {
        setBreakpoint(currentFile, line);
      });

      // Iniciar depuración
      setTimeout(() => {
        console.log('▶️ Iniciando depuración en', currentFile);
        startDebug(currentFile);
      }, 500);
    }, 500);
  };

  const handleEvaluate = () => {
    if (evalExpression.trim() && debugState.isDebugging) {
      evaluateExpression(evalExpression.trim());
      setEvalExpression('');
    }
  };

  const handleStopDebug = () => {
    stopDebug();
    setManualBreakpoints([]);
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
          inputBg: '#1a1a1a',
          success: '#4caf50',
          error: '#ff5555'
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
          inputBg: '#1a2332',
          success: '#4caf50',
          error: '#ff5555'
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
          inputBg: '#ffffff',
          success: '#388E3C',
          error: '#D32F2F'
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
          inputBg: '#ffffff',
          success: '#4caf50',
          error: '#f44336'
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
        {/* <Typography variant="h6" sx={{ color: themeColors.text, fontWeight: 600 }}>
          Depurador de Código
        </Typography> */}
        <Chip 
          label={isConnected ? 'Conectado' : 'Desconectado'}
          color={isConnected ? 'success' : 'error'}
          size="small"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Agregar breakpoints */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: themeColors.accent }}>
            Breakpoints (Puntos de Interrupción)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              label="Número de línea"
              placeholder="Ej: 46"
              value={breakpointLine}
              onChange={(e) => setBreakpointLine(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddBreakpoint()}
              onFocus={() => speakOnFocus('Campo número de línea para breakpoint. Escribe el número y pulsa Enter o el botón Agregar.')}
              variant="outlined"
              type="number"
              disabled={debugState.isDebugging}
              inputProps={{ 
                'aria-label': 'Número de línea para breakpoint',
                min: 1
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  color: themeColors.text,
                  backgroundColor: themeColors.inputBg,
                  '& fieldset': { borderColor: themeColors.border },
                  '&:hover fieldset': { borderColor: themeColors.accent },
                  '&.Mui-focused fieldset': { borderColor: themeColors.accent }
                },
                '& .MuiInputLabel-root': { color: themeColors.textSecondary }
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddBreakpoint}
              disabled={!breakpointLine || debugState.isDebugging}
              startIcon={<AddCircleIcon />}
              onFocus={() => speakOnFocus('Botón para agregar breakpoint en la línea indicada')}
              sx={{
                backgroundColor: themeColors.buttonBg,
                color: themeColors.buttonText,
                '&:hover': {
                  backgroundColor: themeColors.buttonBg,
                  filter: 'brightness(0.9)'
                }
              }}
            >
              Agregar
            </Button>
          </Box>

          {/* Lista de breakpoints */}
          {manualBreakpoints.length > 0 && (
            <Paper sx={{ mt: 2, p: 2, backgroundColor: themeColors.surface }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: themeColors.text }}>
                Breakpoints configurados:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {manualBreakpoints.map(line => (
                  <Chip
                    key={line}
                    label={`Línea ${line}`}
                    onDelete={debugState.isDebugging ? undefined : () => handleRemoveBreakpoint(line)}
                    deleteIcon={<RemoveCircleIcon />}
                    color={debugState.currentLine === line ? 'success' : 'default'}
                    sx={{
                      backgroundColor: debugState.currentLine === line ? themeColors.success : themeColors.inputBg,
                      color: debugState.currentLine === line ? '#fff' : themeColors.text,
                      border: `2px solid ${debugState.currentLine === line ? themeColors.success : themeColors.border}`,
                      fontWeight: debugState.currentLine === line ? 600 : 400,
                      '& .MuiChip-deleteIcon': {
                        color: debugState.currentLine === line ? '#fff' : themeColors.text,
                        '&:hover': {
                          color: debugState.currentLine === line ? '#ffebee' : themeColors.accent
                        }
                      }
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Controles de depuración */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: themeColors.accent }}>
            Controles
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {!debugState.isDebugging ? (
              <Button 
                variant="contained" 
                onClick={handleDebug}
                disabled={manualBreakpoints.length === 0 || !isConnected}
                aria-label="Iniciar depuración" 
                fullWidth
                startIcon={<PlayArrowIcon />}
                onFocus={() => speakOnFocus('Botón iniciar depuración con los breakpoints configurados')}
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
                <Button
                  variant="contained"
                  onClick={step}
                  startIcon={<NavigateNextIcon />}
                  sx={{ 
                    backgroundColor: themeColors.buttonBg,
                    color: themeColors.buttonText,
                    flex: 1
                  }}
                  onFocus={() => speakOnFocus('Botón paso, avanza una línea en la depuración')}
                >
                  Paso
                </Button>
                <Button
                  variant="contained"
                  onClick={stepInto}
                  startIcon={<ArrowForwardIcon />}
                  sx={{ 
                    backgroundColor: themeColors.buttonBg,
                    color: themeColors.buttonText,
                    flex: 1
                  }}
                  onFocus={() => speakOnFocus('Botón entrar, entra en la función llamada en esta línea')}
                >
                  Entrar
                </Button>
                <Button
                  variant="contained"
                  onClick={stepOver}
                  startIcon={<SkipNextIcon />}
                  sx={{ 
                    backgroundColor: themeColors.buttonBg,
                    color: themeColors.buttonText,
                    flex: 1
                  }}
                  onFocus={() => speakOnFocus('Botón saltar, ejecuta la función sin entrar en ella')}
                >
                  Saltar
                </Button>
                <Button
                  variant="contained"
                  onClick={continueExecution}
                  startIcon={<PlayArrowIcon />}
                  sx={{ 
                    backgroundColor: themeColors.success,
                    color: '#fff',
                    flex: 1
                  }}
                  onFocus={() => speakOnFocus('Botón continuar, sigue la ejecución hasta el siguiente breakpoint o el final')}
                >
                  Continuar
                </Button>
                <Button 
                  variant="outlined"
                  onClick={handleStopDebug}
                  startIcon={<StopIcon />}
                  sx={{ 
                    color: themeColors.error,
                    borderColor: themeColors.error,
                    flex: 1,
                    '&:hover': { 
                      borderColor: themeColors.error, 
                      backgroundColor: 'rgba(255,0,0,0.1)' 
                    }
                  }}
                  onFocus={() => speakOnFocus('Botón detener depuración y limpiar breakpoints configurados')}
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
            <strong>Archivo:</strong> {debugState.currentFile || 'N/A'}
          </Typography>
          <Typography variant="body2" sx={{ color: themeColors.text }}>
            <strong>Línea actual:</strong> {debugState.currentLine || 'N/A'}
          </Typography>
        </Paper>
      )}

      {/*  Mostrar excepción si existe */}
      {debugState.exception && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2, 
            mb: 2,
            backgroundColor: themeColors.error + '22',
            border: `2px solid ${themeColors.error}`,
            '& .MuiAlert-icon': {
              color: themeColors.error
            }
          }}
        >
          <AlertTitle sx={{ fontWeight: 600, color: themeColors.text }}>
            {debugState.exception.type}
          </AlertTitle>
          <Typography variant="body2" sx={{ color: themeColors.text, mb: 1 }}>
            <strong>Error:</strong> {debugState.exception.message}
          </Typography>
          <Typography variant="body2" sx={{ color: themeColors.text, mb: 1 }}>
            <strong>Archivo:</strong> {debugState.exception.file}
          </Typography>
          <Typography variant="body2" sx={{ color: themeColors.text }}>
            <strong>Línea:</strong> {debugState.exception.line}
          </Typography>
        </Alert>
      )}

      {/* Variables mejoradas */}
      {debugState.variables && (
        <Paper sx={{ p: 2, backgroundColor: themeColors.surface, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: themeColors.accent, fontWeight: 600 }}>
              Variables en Línea {debugState.currentLine}
            </Typography>
            {debugState.function && (
              <Chip 
                label={`Función: ${debugState.function}`} 
                size="small"
                sx={{ backgroundColor: themeColors.accent, color: themeColors.buttonText }}
              />
            )}
          </Box>

          {/* Variables locales */}
          {debugState.variables.locals && Object.keys(debugState.variables.locals).length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="body2" 
                sx={{ fontWeight: 600, mb: 1, color: themeColors.text }}
                tabIndex={0}
                onFocus={() => speakOnFocus('Sección de variables locales. Lista de variables con su tipo y valor. Usa tab para navegar por cada variable.')}
              >
                Variables Locales:
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {Object.entries(debugState.variables.locals).map(([name, info]) => (
                  <Box 
                    key={name} 
                    sx={{ 
                      mb: 1, 
                      p: 1.5, 
                      backgroundColor: themeColors.inputBg, 
                      borderRadius: 1,
                      borderLeft: `3px solid ${themeColors.accent}`
                    }}
                    tabIndex={0}
                    onFocus={() => {
                      const valueText = String(info.str || info.value);
                      speakOnFocus(`Variable local ${name}, tipo ${info.type}. Valor ${valueText}`);
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: themeColors.text,
                        fontFamily: 'monospace',
                        fontWeight: 600
                      }}
                    >
                      {name} <span style={{ color: themeColors.textSecondary, fontWeight: 'normal' }}>({info.type})</span>
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: themeColors.textSecondary,
                        fontFamily: 'monospace',
                        mt: 0.5,
                        pl: 2,
                        fontSize: '0.9rem'
                      }}
                    >
                      {String(info.str || info.value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Variables de instancia (self) */}
          {debugState.variables.instance && Object.keys(debugState.variables.instance).length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: themeColors.text }}>
                Atributos de Instancia (self):
              </Typography>
              <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                {Object.entries(debugState.variables.instance).map(([name, info]) => (
                  <Box 
                    key={name} 
                    sx={{ 
                      mb: 1, 
                      p: 1.5, 
                      backgroundColor: themeColors.inputBg, 
                      borderRadius: 1,
                      borderLeft: `3px solid #4caf50`
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: themeColors.text,
                        fontFamily: 'monospace',
                        fontWeight: 600
                      }}
                    >
                      self.{name} <span style={{ color: themeColors.textSecondary, fontWeight: 'normal' }}>({info.type})</span>
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: themeColors.textSecondary,
                        fontFamily: 'monospace',
                        mt: 0.5,
                        pl: 2,
                        fontSize: '0.9rem'
                      }}
                    >
                      {String(info.str || info.value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Variables globales */}
          {debugState.variables.globals && Object.keys(debugState.variables.globals).length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: themeColors.text }}>
                Variables Globales:
              </Typography>
              <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                {Object.entries(debugState.variables.globals).map(([name, info]) => (
                  <Box 
                    key={name} 
                    sx={{ 
                      mb: 1, 
                      p: 1.5, 
                      backgroundColor: themeColors.inputBg, 
                      borderRadius: 1,
                      borderLeft: `3px solid #ff9800`
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: themeColors.text,
                        fontFamily: 'monospace',
                        fontWeight: 600
                      }}
                    >
                      {name} <span style={{ color: themeColors.textSecondary, fontWeight: 'normal' }}>({info.type})</span>
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: themeColors.textSecondary,
                        fontFamily: 'monospace',
                        mt: 0.5,
                        pl: 2,
                        fontSize: '0.9rem'
                      }}
                    >
                      {String(info.str || info.value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Evaluador de expresiones */}
      {/* {debugState.isDebugging && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ my: 2, borderColor: themeColors.border }} />
          <Typography variant="subtitle2" sx={{ color: themeColors.accent, mb: 2, fontWeight: 600 }}>
            💻 Evaluador de Expresiones
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Evaluar expresión"
                placeholder="Ej: calc.add(5, 3)"
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
                <strong>{debugState.lastEvaluation.expression}</strong> = {String(debugState.lastEvaluation.result)}
              </Typography>
            </Paper>
          )}
        </Box>
      )} */}

      
      {/* Errores */}
      {/* {debugState.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {debugState.error}
        </Alert>
      )} */}
    </Box>
  );
});

Debug.displayName = 'Debug';
export default Debug;