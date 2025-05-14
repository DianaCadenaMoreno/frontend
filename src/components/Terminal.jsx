import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import axiosInstance from '../utils/axiosInstance';

function Terminal({ debug, contrast, output, pid, ref }) {
  const [history, setHistory] = useState([]); 
  const [input, setInput] = useState(''); 
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [output]);

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const command = input.trim();
      setInput('');
      const ws = ref.current?.getWebSocket();

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ input: command })); // Enviar input por WebSocket
      }
      
      if (command === 'clear') {
        setHistory([]); // Limpia la terminal
      } else {
        setHistory(prevHistory => [
          ...prevHistory,
          { prompt: '>', text: command, color: 'white' }, // Comando ejecutado
        ]);
      }
    }
  };

  const terminalStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
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
      {(output || []).map((line, index) => (
        <Typography key={index} sx={{ color: line.color || 'white' }}>
          {line.prompt && <span style={{ color: '#1976D2', fontWeight: 'bold' }}>{line.prompt}</span>}
          {line.text}
        </Typography>
      ))}

      {/* Línea de entrada con prompt azul */}
      <Box sx={{ display: 'flex' }}>
        <Typography sx={{ color: '#1976D2', fontWeight: 'bold' }}>&gt;</Typography>
        <TextField
          inputRef={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            style: { color: 'white', backgroundColor: 'transparent', width: '100%' },
            autoComplete: 'off', 
          }}
        />
      </Box>
    </Box>
  );
}

export default Terminal;