// src/components/FileManager.js
import React from 'react';
import { Box, Tabs, Tab, Typography, TextField, IconButton, CircularProgress, Button, Collapse } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import generateCode from '../utils/chat';
import useSpeechRecognition from '../utils/speech';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CopyToClipboard } from 'react-copy-to-clipboard';

function FileManager({ contrast, codeStructure }) {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [prompt, setPrompt] = React.useState('');
  // const [generatedCode, setGeneratedCode] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const { isListening, transcript, setIsListening } = useSpeechRecognition();
  const [isCodeStructureOpen, setIsCodeStructureOpen] = React.useState(false);

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
        { role: 'model', content: response },
      ]);
      setPrompt('');
    } catch (error) {
      console.error("Error al generar código:", error);
    } finally {
      setLoading(false);
    }
  };

  const CodeBlock = ({ code }) => (
    <div style={{ position: 'relative', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
      <CopyToClipboard text={code}>
        <Button variant="contained" color="primary" style={{ position: 'absolute', top: '10px', right: '10px' }}>
          Copiar
        </Button>
      </CopyToClipboard>
      <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
        <code>{code}</code>
      </pre>
    </div>
  );

  const ChatHistory = ({ chatHistory, contrast }) => (
    <div>
      {chatHistory.map((message, index) => (
        <div key={index} style={{ marginBottom: '10px' }}>
          <Typography style={{ color: contrast === 'high-contrast' ? '#fff' : '#000' }}>
            <strong>{message.role === 'user' ? 'Tú: ' : 'Copiloto: '}</strong>
          </Typography>
          {message.content.split(/(```[\s\S]*?```)/g).map((part, i) => (
            part.startsWith('```') ? (
              <CodeBlock key={i} code={part.slice(3, -3)} />
            ) : (
              <Typography key={i} style={{ color: contrast === 'high-contrast' ? '#fff' : '#000', marginBottom: '10px' }}>
                {part}
              </Typography>
            )
          ))}
        </div>
      ))}
    </div>
  );

  const handleMicClick = () => {
    setIsListening(prevState => !prevState);
  };

  return (
     <Box sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
      <Tabs value={tabIndex} onChange={handleTabChange} aria-label="File Manager Tabs" 
        textColor={contrast === 'high-contrast' ? 'inherit' : 'primary'}
        indicatorColor={'primary'}>
        <Tab label="Files" />
        <Tab label="Chat" />
        {/* pestañas */}
      </Tabs>
      <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
        {tabIndex === 1 && (
          <div>
            <Box sx={{ flexGrow: 1, overflowX: 'auto', mb: 2, height: '380px' }}>
              <Typography variant="h6" component="h2" aria-live="polite">
                Bienvenido a tu copiloto, estoy aquí para ayudarte a hacer las cosas más rápido.
              </Typography>
              {loading ? (
                <CircularProgress color={contrast === 'high-contrast' ? 'inherit' : 'primary'}/>
              ) : (
                // <div>
                //   {chatHistory.map((message, index) => (
                //     <Typography key={index} style={{ color: contrast === 'high-contrast' ? '#fff' : '#000' }}>
                //       <strong>{message.role === 'user' ? 'Tú: ' : 'Copiloto: '}</strong>
                //       {message.content}
                //     </Typography>
                //   ))}
                // </div>
                <ChatHistory chatHistory={chatHistory} contrast={contrast} /> 
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
      <Box>
        {/* <Typography variant="h6">Estructura del Código</Typography> */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6">Estructura del Código</Typography>
          <IconButton onClick={() => setIsCodeStructureOpen(!isCodeStructureOpen)} aria-label="Toggle code structure">
            {isCodeStructureOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Collapse in={isCodeStructureOpen}>
          <ul>
            {codeStructure.map((item, index) => (
              <li key={index}>
                {item.type} {item.name ? `- ${item.name}` : ''} en línea {item.line} y cierra en línea {item.end_line}
              </li>
            ))}
          </ul>
        </Collapse>
      </Box>
    </Box>
  );
}

export default FileManager;
