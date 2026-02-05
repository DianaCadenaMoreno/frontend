import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { useScreenReader } from '../contexts/ScreenReaderContext';
import { useAppNavigation } from '../contexts/NavigationContext';

const Terminal = React.forwardRef(({ debug, contrast, output, pid, textEditorRef }, ref) => {
  const [history, setHistory] = useState([]); 
  const [input, setInput] = useState(''); 
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const { speak, speakOnFocus, speakOnHover, cancelHoverSpeak, announce } = useScreenReader();
  const { registerComponent, unregisterComponent, setFocusedComponent } = useAppNavigation();

  const getThemeColors = (contrast) => {
    switch(contrast) {
      case 'high-contrast':
        return {
          background: '#000000',
          text: '#ffffff',
          prompt: '#f7ff0fff',
          output: '#50fa7b',
          error: '#ff5555',
          info: '#8be9fd',
          border: '#404040'
        };
      case 'blue-contrast':
        return {
          background: '#0d1117',
          text: '#E0E0E0',
          prompt: '#4FC3F7',
          output: '#81C784',
          error: '#ff5252',
          info: '#4DD0E1',
          border: '#2C3E50'
        };
      case 'yellow-contrast':
        return {
          background: '#FFFDE7',
          text: '#212121',
          prompt: '#D32F2F',
          output: '#388E3C',
          error: '#D32F2F',
          info: '#1976D2',
          border: '#E0E0E0'
        };
      default:
        return {
          background: '#1e1e1e',
          text: '#ffffff',
          prompt: '#1976D2',
          output: '#4caf50',
          error: '#f44336',
          info: '#2196f3',
          border: '#333333'
        };
    }
  };

  const themeColors = getThemeColors(contrast);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output, history]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Registrar componente en el sistema de navegación
  useEffect(() => {
    const terminalAPI = {
      focus: () => {
        if (inputRef.current) {
          inputRef.current.focus();
          speak('Terminal enfocada. Escribe comandos de tu programa en ejecución.');
        }
      },
      clear: () => {
        setHistory([]);
        setInput('');
        announce('Terminal limpiada');
      },
    };

    registerComponent('terminal-input', terminalAPI);

    return () => {
      unregisterComponent(' terminal-input');
    };
  }, [registerComponent, unregisterComponent, speak, announce]);

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const command = input.trim();
      setInput('');
      
      if (command === 'clear') {
        setHistory([]);
        return;
      }

      // Ctrl+C - Interrumpir proceso
      if (event.ctrlKey && event.key === 'c') {
        event.preventDefault();
        const ws = textEditorRef?.current?.getWebSocket();
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            action: 'interrupt',
            pid: pid
          }));
          announce('Señal de interrupción enviada');
        } else {
          announce('No hay proceso en ejecución');
        }
        return;
      }

      // Agregar comando al historial visual
      setHistory(prevHistory => [
        ...prevHistory,
        { prompt: '>', text: command, color: themeColors.prompt }
      ]);

      // Obtener WebSocket del TextEditor
      const ws = textEditorRef?.current?.getWebSocket();
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Enviar input al proceso en ejecución
        ws.send(JSON.stringify({
          action: 'stdin',
          data: command
        }));
      } else {
        setHistory(prev => [...prev, { 
          prompt: '', 
          text: 'No hay proceso en ejecución o WebSocket no está conectado', 
          color: themeColors.error 
        }]);
      }
    }
  };

  const terminalStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: themeColors.background,
    color: themeColors.text,
    height: '100%',
    minHeight: 0,
    padding: '10px',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: '14px',
    borderRadius: '5px',
  };

  return (
    <Box sx={terminalStyle} ref={terminalRef}>
      {/* Mostrar historial local */}
      {history.map((line, index) => (
        <Typography 
          key={`history-${index}`}
          sx={{ 
            color: line.color || themeColors.text,
            fontFamily: 'inherit',
            fontSize: 'inherit'
          }}
        >
          {line.prompt && (
            <span style={{ 
              color: themeColors.prompt, 
              fontWeight: 'bold' 
            }}>
              {line.prompt}{' '}
            </span>
          )}
          {line.text}
        </Typography>
      ))}

      {/* Mostrar output del proceso */}
      {(output || []).map((line, index) => (
        <Typography 
          key={`output-${index}`}
          sx={{ 
            color: line.color || themeColors.text,
            fontFamily: 'inherit',
            fontSize: 'inherit',
            whiteSpace: 'pre-wrap'
          }}
        >
          {line.prompt && (
            <span style={{ 
              color: themeColors.prompt, 
              fontWeight: 'bold' 
            }}>
              {line.prompt}{' '}
            </span>
          )}
          {line.text}
        </Typography>
      ))}

      {/* Input */}
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Typography sx={{ 
          color: themeColors.prompt, 
          fontWeight: 'bold',
          mr: 0.5
        }}>
          &gt;
        </Typography>
        <TextField
          inputRef={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setFocusedComponent('terminal');
            speakOnFocus('terminal envia comandos, también puedes dar CTRL + C para finalizar el proceso actual.');
          }}
          variant="standard"
          fullWidth
          placeholder="Escribe un comando o input..."
          InputProps={{
            disableUnderline: true,
            style: { 
              color: themeColors.text, 
              backgroundColor: 'transparent',
              fontFamily: 'Consolas, "Courier New", monospace',
              fontSize: '14px'
            },
            autoComplete: 'off',
          }}
          aria-label = "Campo de entrada de la terminal"
          aria-describedby='terminal-help-text'
        />
      </Box>
    </Box>
  );
});

Terminal.displayName = 'Terminal';
export default Terminal;