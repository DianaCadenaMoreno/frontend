// src/components/FileManager.js
import React from 'react';
import { Box, Tabs, Tab, Typography, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import generateCode from '../utils/chat';
import useSpeechRecognition from '../utils/speech';

function FileManager({ contrast }) {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [prompt, setPrompt] = React.useState('');
  // const [generatedCode, setGeneratedCode] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const { isListening, transcript, setIsListening } = useSpeechRecognition();

  React.useEffect(() => {
    if (transcript) {
      setPrompt(prevPrompt => `${prevPrompt} ${transcript}`);
    }
  }, [transcript]);
  
  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  // const handleGenerateCode = () => {
  //   generateCode(prompt, setGeneratedCode, setLoading);
  // };

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const response = await generateCode(prompt, setLoading, chatHistory);
      setChatHistory(prevHistory => [
        ...prevHistory,
        { role: 'user', content: prompt },
        { role: 'model', content: response }
      ]);
      setPrompt('');
    } catch (error) {
      console.error("Error al generar código:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMicClick = () => {
    setIsListening(prevState => !prevState);
  };

  return (
     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Tabs value={tabIndex} onChange={handleTabChange} aria-label="File Manager Tabs" 
        textColor={contrast === 'high-contrast' ? 'inherit' : 'primary'}
        indicatorColor={'primary'}>
        <Tab label="Files" />
        <Tab label="Chat" />
        {/* pestañas */}
      </Tabs>
      <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {tabIndex === 1 && (
          <div>
            <Box sx={{ flexGrow: 1, overflowX: 'auto', mb: 2 }}>
              <Typography variant="h6" component="h2" aria-live="polite">
                Bienvenido a tu copiloto, estoy aquí para ayudarte a hacer las cosas más rápido.
              </Typography>
              {loading ? (
                <CircularProgress color={contrast === 'high-contrast' ? 'inherit' : 'primary'}/>
              ) : (
                <div>
                  {chatHistory.map((message, index) => (
                    <Typography key={index} style={{ color: contrast === 'high-contrast' ? '#fff' : '#000' }}>
                      <strong>{message.role === 'user' ? 'Tú: ' : 'Copiloto: '}</strong>
                      {message.content}
                    </Typography>
                  ))}
                </div>
                // <pre style={{ color: contrast === 'high-contrast' ? '#fff' : '#000' }}>{generatedCode}</pre>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Escribe o pregunta algo a tu copiloto..."
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                aria-label="Descripción del código"
                InputProps={{
                  style: { color: contrast === 'high-contrast' ? '#fff' : '#000' },
                  endAdornment: (
                    <>
                    <IconButton onClick={handleMicClick} color={isListening ? "error" : contrast === 'high-contrast' ? "inherit" : "primary"}>
                      <MicIcon />
                    </IconButton>
                    <IconButton onClick={handleGenerateCode} color={contrast === 'high-contrast' ? "inherit" : "primary"}>
                      <SendIcon />
                    </IconButton>
                    </>
                  ),
                }}
              />
            </Box>
          </div>
        )}
        {/* contenido para otras pestañas */}
      </Box>
    </Box>
  );
}

export default FileManager;
