import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Breadcrumbs, Link, Button, CircularProgress, Stack } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Editor, { loader } from '@monaco-editor/react'; // Importa loader
import axiosInstance from '../utils/axiosInstance';

function handleClick(event) {
  event.preventDefault();
  console.info('You clicked a breadcrumb.');
}

// Definir tema personalizado de alto contraste
const defineCustomThemes = async () => {
  const monaco = await loader.init();
  
  // Tema de Alto Contraste personalizado
  monaco.editor.defineTheme('high-contrast-custom', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'FFEB3B', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0eee46ff' },
      { token: 'string', foreground: 'df0cd5ff' },
      { token: 'number', foreground: '04fdf1ff' },
      { token: 'type', foreground: '2b09ecff' },
      { token: 'class', foreground: '2b09ecff' },
      { token: 'function', foreground: 'D32F2F' },
      { token: 'variable', foreground: '2b09ecff' },
      { token: 'constant', foreground: '2b09ecff' },
      { token: 'operator', foreground: 'ffffff' },
      { token: 'delimiter', foreground: 'ffffff' },
    ],
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#ffffff',
      'editor.lineHighlightBackground': '#1a1a1a',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#ffffff',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#3a3d41',
      'editorCursor.foreground': '#ffffff',
      'editor.findMatchBackground': '#515c6a',
      'editor.findMatchHighlightBackground': '#ea5c0055',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
      'editorWhitespace.foreground': '#505050',
      'editorWidget.background': '#1e1e1e',
      'editorWidget.border': '#454545',
      'editorSuggestWidget.background': '#1e1e1e',
      'editorSuggestWidget.selectedBackground': '#264f78',
      'editorHoverWidget.background': '#1e1e1e',
      'editorHoverWidget.border': '#454545',
    }
  });

  // Tema de Contraste Azul
  monaco.editor.defineTheme('blue-contrast-custom', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '4FC3F7', fontStyle: 'bold' },
      { token: 'string', foreground: 'FFE082' },
      { token: 'number', foreground: 'B39DDB' },
      { token: 'type', foreground: '4DD0E1' },
      { token: 'class', foreground: '81C784' },
      { token: 'function', foreground: '81C784' },
      { token: 'variable', foreground: 'E0E0E0' },
      { token: 'constant', foreground: 'B39DDB' },
      { token: 'operator', foreground: '4FC3F7' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#E0E0E0',
      'editor.lineHighlightBackground': '#1a2332',
      'editorLineNumber.foreground': '#7289DA',
      'editorLineNumber.activeForeground': '#4FC3F7',
      'editor.selectionBackground': '#264f7880',
      'editorCursor.foreground': '#4FC3F7',
      'editor.findMatchBackground': '#42A5F5',
      'editorIndentGuide.background': '#2C3E50',
      'editorIndentGuide.activeBackground': '#4FC3F7',
    }
  });

  // Tema de Contraste Amarillo
  monaco.editor.defineTheme('yellow-contrast-custom', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: 'D32F2F', fontStyle: 'bold' },
      { token: 'string', foreground: 'F57C00' },
      { token: 'number', foreground: '7B1FA2' },
      { token: 'type', foreground: '1976D2' },
      { token: 'class', foreground: '388E3C' },
      { token: 'function', foreground: '388E3C' },
      { token: 'variable', foreground: '212121' },
      { token: 'constant', foreground: '7B1FA2' },
      { token: 'operator', foreground: 'D32F2F' },
    ],
    colors: {
      'editor.background': '#FFFDE7',
      'editor.foreground': '#212121',
      'editor.lineHighlightBackground': '#FFF9C4',
      'editorLineNumber.foreground': '#757575',
      'editorLineNumber.activeForeground': '#D32F2F',
      'editor.selectionBackground': '#FFE082',
      'editorCursor.foreground': '#D32F2F',
      'editor.findMatchBackground': '#04fdf1ff',
      'editorIndentGuide.background': '#E0E0E0',
      'editorIndentGuide.activeBackground': '#FDD835',
    }
  });
};

const TextEditor = React.forwardRef(({ contrast, fontSize, setOutput, setCodeStructure, editorContent, setEditorContent, setPid, currentFileName, unsavedChanges, onSave }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const editorRef = useRef(null);
  const [debugPoints, setDebugPoints] = useState({ start: null, end: null, content: '' });
  const [breakpoints, setBreakpoints] = useState([]);

  useEffect(() => {
    defineCustomThemes();
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }, 200); // Delay pequeño para evitar conflictos con renderización inicial
  }, []);

  // Actualizar el tamaño de fuente cuando cambie
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize: fontSize });
    }
  }, [fontSize]);
  
  // Función para activar el foco en el editor
  React.useImperativeHandle(ref, () => ({
    getWebSocket: () => wsInstance,
    getCurrentFileName: () => currentFileName,
    getContent: () => editorContent,
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

  const getEditorTheme = (contrast) => {
    switch(contrast) {
      case 'high-contrast':
        return 'high-contrast-custom';
      case 'blue-contrast':
        return 'blue-contrast-custom';
      case 'yellow-contrast':
        return 'yellow-contrast-custom';
      default:
        return 'vs-light';
    }
  };

  const breadcrumbs = [
    <Typography 
      key="3" 
      color={contrast === 'high-contrast' ? '#fff' : 'text.primary'}
      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
    >
      {currentFileName || 'Sin archivo'}
      {unsavedChanges && (
        <span 
          style={{ 
            fontSize: '0.8em', 
            color: contrast === 'high-contrast' ? '#ffeb3b' : '#f57c00',
            fontWeight: 'bold'
          }}
          aria-label="Archivo con cambios sin guardar"
        >
          ●
        </span>
      )}
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
    // if ('speechSynthesis' in window) {
    //   const utterance = new SpeechSynthesisUtterance(textToSpeak);
    //   utterance.lang = 'es-ES'; 
    //   utterance.onerror = (error) => console.error('Speech synthesis error:', error);
    //   window.speechSynthesis.speak(utterance);
    // } else {
    //   console.error('Speech synthesis not supported in this browser.');
    // }
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
      setOutput([{ prompt: '', text: 'Error: No hay código para ejecutar', color: '#ff5555' }]);
      return;
    }

    // Limpiar output anterior
    setOutput([{ prompt: '', text: 'Conectando...', color: '#8be9fd' }]);

    // Crear WebSocket
    //const wsUrl = 'ws://localhost/ws/terminal/'; // local
    const wsUrl = 'wss://backend-g1zl.onrender.com/ws/terminal/'; // producción
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket conectado');
      setOutput([{ prompt: '', text: 'Ejecutando código...', color: '#8be9fd' }]);
      
      // Enviar código al servidor
      ws.send(JSON.stringify({
        action: 'upload_files',
        files: {
          'main.py': editorContent
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
          case 'files_saved':
            // Iniciar ejecución
            ws.send(JSON.stringify({
              action: 'run',
              entrypoint: 'main.py',
              timeout: 60
            }));
            break;
            
          case 'started':
            setPid(data.pid);
            setOutput(prev => [...prev, { prompt: '', text: `Proceso iniciado (PID: ${data.pid})`, color: '#50fa7b' }]);
            break;
            
          case 'output':
            setOutput(prev => [...prev, { 
              prompt: '', 
              text: data.data,
              color: data.stream === 'stderr' ? '#ff5555' : '#ffffff'
            }]);
            break;
            
          case 'execution_finished':
            setOutput(prev => [...prev, { 
              prompt: '', 
              text: `\nProceso finalizado (código: ${data.exit_code})`,
              color: data.exit_code === 0 ? '#50fa7b' : '#ff5555'
            }]);
            break;
            
          case 'timeout':
            setOutput(prev => [...prev, { prompt: '', text: '\nTimeout: El proceso excedió el tiempo límite', color: '#ff5555' }]);
            break;
            
          case 'error':
            setOutput(prev => [...prev, { prompt: '', text: `Error: ${data.message}`, color: '#ff5555' }]);
            break;
            
          case 'stdin_sent':
            // Confirmación de input enviado
            break;
            
          default:
            console.warn('Tipo de mensaje desconocido:', data.type);
        }
      } catch (error) {
        console.error('Error al procesar mensaje:', error);
        setOutput(prev => [...prev, { prompt: '', text: event.data, color: '#ffffff' }]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setOutput(prev => [...prev, { prompt: '', text: 'Error de conexión WebSocket', color: '#ff5555' }]);
    };

    ws.onclose = () => {
      console.log('WebSocket desconectado');
      setWsInstance(null);
    };

    setWsInstance(ws);
  };

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

  // Manejar Alt+S en el editor
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        if (onSave) {
          onSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);
  
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
        {/* Breadcrumbs con indicador de guardado */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Stack spacing={2}>
          <Breadcrumbs 
            separator="›" 
            aria-label="Navegación de ubicación del archivo"
          >
            {breadcrumbs}
          </Breadcrumbs>
        </Stack>
      </Box>
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
              scrollbar: { 
                vertical: 'auto', 
                horizontal: 'auto',
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 14,
              },
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              padding: { top: 10, bottom: 10 },
              lineDecorationsWidth: 5,
              glyphMargin: true,
              border: 'none',
              fontSize: fontSize,
              fontWeight: contrast === 'high-contrast' ? '500' : 'normal',
              letterSpacing: contrast === 'high-contrast' ? 0.5 : 0,
              lineHeight: Math.round(fontSize * 1.5),
              cursorWidth: 2,
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              // Aumentar contraste visual
              renderWhitespace: contrast === 'high-contrast' ? 'boundary' : 'none',
              guides: {
                indentation: true,
                highlightActiveIndentation: true,
              },
            }}
            theme={getEditorTheme(contrast)}
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
