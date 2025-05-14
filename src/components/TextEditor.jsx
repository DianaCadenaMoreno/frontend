import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Breadcrumbs, Link, Button, CircularProgress } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Editor, { loader } from '@monaco-editor/react'; // Importa loader
import axiosInstance from '../utils/axiosInstance';

function handleClick(event) {
  event.preventDefault();
  console.info('You clicked a breadcrumb.');
}

const TextEditor = React.forwardRef(({ contrast, setOutput, setCodeStructure, editorContent, setEditorContent, setPid }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const editorRef = useRef(null);
  const [debugPoints, setDebugPoints] = useState({ start: null, end: null, content: '' });
  const [breakpoints, setBreakpoints] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }, 200); // Delay pequeño para evitar conflictos con renderización inicial
  }, []);
  
  // Función para activar el foco en el editor
  React.useImperativeHandle(ref, () => ({
    focusEditor: () => {
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          const lastLine = model.getLineCount();
          const lastColumn = model.getLineMaxColumn(lastLine);
          editorRef.current.setPosition({ lineNumber: lastLine, column: lastColumn });
        }
        editorRef.current.focus();
      }
    },
  }));

  const breadcrumbs = [
    // <Link underline="hover" key="1" color={contrast === 'high-contrast' ? '#fff' : 'inherit'} href="/" onClick={handleClick}>
    //   MUI
    // </Link>,
    // <Link
    //   underline="hover"
    //   key="2"
    //   color={contrast === 'high-contrast' ? '#fff' : 'inherit'}
    //   href="/material-ui/getting-started/installation/"
    //   onClick={handleClick}
    // >
    //   Core
    // </Link>,
    <Typography key="3" color={contrast === 'high-contrast' ? '#fff' : 'text.primary'}>
      file.py
    </Typography>,
  ];

  const handleAnalyzeStructure = async (code) => {
    try {
      const response = await axiosInstance.post('structure/', { code });
      setCodeStructure(response.data.structure || []);
    } catch (error) {
      console.error('Error analyzing code structure:', error);
    }
  };

  const [isEditorEmpty, setIsEditorEmpty] = useState(true);  

  // const handleEditorChange = (value) => {
  //   if (!hasStartedTyping) {
  //     setHasStartedTyping(true);
  //     setEditorContent('');
  //   } else {
  //     setEditorContent(value);
  //     handleAnalyzeStructure(value);

  //     if (value && 'speechSynthesis' in window) {
  //       const utterance = new SpeechSynthesisUtterance(value);
  //       utterance.onerror = (e) => console.error('Speech synthesis error:', e);
  //       window.speechSynthesis.speak(utterance);
  //     } else {
  //       console.error('Speech synthesis not supported in this browser.');
  //     }
  //   }
  // };

  const handleEditorChange = (value) => {
    if (value === undefined || value.trim() === "") {
      setIsEditorEmpty(true);
      setEditorContent("");
    } else {
      setIsEditorEmpty(false);
      setEditorContent(value);
      handleAnalyzeStructure(value);
    }
  };

  const handleCursorChange = (e) => {
    const position = e.position;
    const model = editorRef.current.getModel();
    const lineContent = model.getLineContent(position.lineNumber).substring(0, position.column - 1);

    let textToSpeak = lineContent || `Line ${position.lineNumber}`;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.onerror = (error) => console.error('Speech synthesis error:', error);
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis not supported in this browser.');
    }
  };

  // const handleSendFile = async () => {
  //   setIsLoading(true);
  //   const blob = new Blob([editorContent], { type: 'text/x-python' });
  //   const formData = new FormData();
  //   formData.append('file', blob, 'main.py');
  //   formData.append('main_file', 'main.py');
  //   console.log(formData);
  //   try {
  //     const response = await axiosInstance.post('run/', formData);
  //     const result = response.data;
  //     setIsLoading(false);
  //     console.log(result);
  //     setOutput(result);
  //     setPid(result.pid);
  //   } catch (error) {
  //     console.error('Error uploading file:', error);
  //     setIsLoading(false);
  //   }
  // };
  const [wsInstance, setWsInstance] = useState(null);

  const handleSendFile = () => {
    if (!editorContent.trim()) {
      console.error('No hay código para ejecutar.');
      return;
    }
  
    // Crear una conexión WebSocket
    //const ws = new WebSocket(`ws://localhost:80/ws/terminal/`); //local
    const ws = new WebSocket(`wss://backend-g1zl.onrender.com/ws/terminal/`); // pro
    setWsInstance(ws);
    // ws.onopen = () => {
    //   console.log('WebSocket conectado');
    //   // Enviar el código al WebSocket
    //   ws.send(JSON.stringify({ code: editorContent, inputs: [] })); 
    // };
    ws.onopen = () => {
      console.log('WebSocket conectado');
      // Enviar el código al WebSocket
      ws.send(JSON.stringify({ code: editorContent, inputs: [] }));
    };
  
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data); // analizar el mensaje como JSON
        if (data.status === 'output') {
          setOutput(prev => [...prev, {prompt: '', text: data.output}]);
        } else if (data.status === 'input') {
          setOutput(prev => [...prev, {prompt: data.prompt, text: ''}]);
        } else if (data.status === 'error') {
          console.error(`Error: ${data.error}`);
        } else if (data.status === 'success') {
          console.log('Ejecución completada:', data.output);
        }
      } catch (error) {
        // Si no es un JSON válido, simplemente muestra el mensaje como texto
        console.warn('Mensaje no JSON recibido:', event.data);
        setOutput((prevOutput) => prevOutput + '\n' + event.data);
      }
    };
  
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  
    ws.onclose = () => {
      console.log('WebSocket desconectado');
    };
  };

  React.useImperativeHandle(ref, () => ({
    getWebSocket: () => wsInstance,
  }));  

  const handleBreakpointClick = async (e) => {
    const monaco = await loader.init(); // Inicializa monaco
    const lineNumber = e.target.position.lineNumber;
    const model = editorRef.current.getModel();
    const decorations = model.getLineDecorations(lineNumber);

    if (decorations.length > 0) {
      // Remove breakpoint
      const newBreakpoints = breakpoints.filter(bp => bp.lineNumber !== lineNumber);
      setBreakpoints(newBreakpoints);
      model.deltaDecorations(decorations.map(d => d.id), []);
    } else {
      // Add breakpoint
      const newBreakpoint = {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'myBreakpoint',
          glyphMarginClassName: 'myBreakpointGlyph',
        },
      };
      const newBreakpoints = [...breakpoints, newBreakpoint];
      setBreakpoints(newBreakpoints);
      model.deltaDecorations([], [newBreakpoint]);
    }
  };

  const handleTranscription = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
  
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
  
        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop()); // Liberar micrófono
          setIsRecording(false);
  
          if (audioChunksRef.current.length === 0) return;
  
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.wav');
  
          try {
            const response = await axiosInstance.post('transcribe/', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
  
            const code = response.data.code;
            if (code) {
              setEditorContent(prev => prev + '\n' + code);
              handleAnalyzeStructure(code);
            }
          } catch (err) {
            console.error('Error al enviar audio:', err);
          }
        };
  
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accediendo al micrófono:', error);
      }
    } else {
      mediaRecorderRef.current?.stop();
    }
  };
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  
  return (
    <Box ref={ref} style={{ height: '55%', display: 'flex', flexDirection: 'column', minHeight: 0}}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        style={{
          paddingLeft: '15px',
          paddingRight: '15px',
          paddingTop: '5px',
          paddingBottom: '5px',
          color: contrast === 'high-contrast' ? '#fff' : '#000',
        }}
      >
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          {breadcrumbs}
        </Breadcrumbs>
        <Box 
          display="flex" 
          flexWrap="wrap" 
          gap={1} 
          justifyContent="center" 
          alignItems="center"
        >
          <Button 
            variant="contained" 
            size="small" 
            color="success" 
            onClick={handleSendFile} 
            aria-label="Ejecutar archivo"
            style={{ flex: '1 1 auto', minWidth: '120px' }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Ejecutar'}
          </Button>
          <Button
            variant="contained"
            size="small"
            color={isRecording ? "error" : "info"}
            onClick={handleTranscription}
            aria-label={isRecording ? "Detener grabación" : "Iniciar grabación"}
            style={{ flex: '1 1 auto', minWidth: '120px' }}
          >
            {isRecording ? 'Detener' : 'Transcribir'}
          </Button>
          {isRecording && (
            <Button 
              size="small" 
              color="warning" 
              onClick={() => {
                mediaRecorderRef.current?.stop();
                streamRef.current?.getTracks().forEach(track => track.stop());
                audioChunksRef.current = [];
                setIsRecording(false);
              }}
              style={{ flex: '1 1 auto', minWidth: '120px' }}
            >
              Cancelar
            </Button>
          )}
        </Box>
      </Box>
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box style={{ position: 'relative', flex: 1, height: '100%', minHeight: 0 }}>
          {isEditorEmpty && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 90,
                color: '#888',
                pointerEvents: 'none',
                fontSize: '14px',
                zIndex: 1,
              }}
            >
              # Comienza a escribir para ignorar...
            </div>
          )}
          <Editor
            height="100%"
            defaultLanguage="python"
            value={editorContent}
            onChange={handleEditorChange}
            options={{
              selectOnLineNumbers: true,
              minimap: { enabled: false },
              scrollbar: { vertical: 'auto', horizontal: 'auto' },
              lineNumbers: 'on',
              renderLineHighlight: 'none',
              padding: { top: 10, bottom: 10 },
              lineDecorationsWidth: 5,
              glyphMargin: true,
              border: 'none',
            }}
            theme={contrast === 'high-contrast' ? 'vs-dark' : 'vs-light'}
            onMount={(editor) => {
              editorRef.current = editor;
              editor.onDidChangeCursorPosition(handleCursorChange);
              editor.onMouseDown(handleBreakpointClick);
            }}
          />
        </Box>
      </Box>
    </Box>
  );
});

export default TextEditor;