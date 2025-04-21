import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import axiosInstance from '../utils/axiosInstance';

function Terminal({ debug, contrast, output, pid }) {
  const [history, setHistory] = useState([]); 
  const [input, setInput] = useState(''); 
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (pid) {
      const ws = new WebSocket(`ws://localhost:80/ws/terminal/?pid=${pid}`); // Incluye el PID en la URL
      setSocket(ws);
  
      ws.onopen = () => {
        console.log('WebSocket conectado');
      };
  
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'success') {
          setHistory((prevHistory) => [
            ...prevHistory,
            { prompt: '', text: data.output, color: 'white' },
          ]);
        } else if (data.status === 'error') {
          setHistory((prevHistory) => [
            ...prevHistory,
            { prompt: '', text: `Error: ${data.error}`, color: 'red' },
          ]);
        } else if (data.status === 'input') {
          setHistory((prevHistory) => [
            ...prevHistory,
            { prompt: data.prompt, text: data.input, color: 'yellow' },
          ]);
        }
      };
  
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
  
      ws.onclose = () => {
        console.log('WebSocket desconectado');
      };
  
      return () => {
        ws.close();
      };
    }
  }, [pid]); // Solo se ejecuta cuando cambia el PID

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [history]);

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const command = input.trim();
      setInput('');

      if (command === 'clear') {
        setHistory([]); // Limpia la terminal
      } else {
        setHistory(prevHistory => [
          ...prevHistory,
          { prompt: '>', text: command, color: 'white' }, // Comando ejecutado
        ]);

        console.log("pid desde porops", pid);

        // Enviar la entrada del usuario al backend
        try {
          const response = await axiosInstance.post('send_input/', { pid, input: command });
          const result = response.data;
          setHistory(prevHistory => [
            ...prevHistory,
            { prompt: '', text: result.stdout || result.stderr, color: 'white' }
          ]);
        } catch (error) {
          console.error('Error sending input:', error);
        }
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
      {history.map((line, index) => (
        <Typography key={index} sx={{ color: line.color }}>
          <span style={{ color: 'white', fontWeight: 'bold' }}>{line.prompt}</span> {line.text}
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