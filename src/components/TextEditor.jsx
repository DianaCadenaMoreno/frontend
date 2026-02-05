import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Breadcrumbs, Link, Button, CircularProgress, Stack } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Editor, { loader } from '@monaco-editor/react'; // Importa loader
import axiosInstance from '../utils/axiosInstance';
import { useScreenReader } from '../contexts/ScreenReaderContext';
import { useAppNavigation } from '../contexts/NavigationContext';

// tema personalizado de alto contraste
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
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const [wsInstance, setWsInstance] = useState(null);
  const [currentLine, setCurrentLine] = useState(1);
  const [currentColumn, setCurrentColumn] = useState(1);
  const { speak, speakOnFocus, announce } = useScreenReader();
  const { registerComponent, unregisterComponent } = useAppNavigation();
  const [isExecuting, setIsExecuting] = useState(false);
  const transcriptionCancelledRef = useRef(false);
  const transcriptionControllerRef = useRef(null);

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

  const handleCursorChange = useCallback((e) => {
    const position = e.position;
    const model = editorRef.current.getModel();
    
    if (!model) return;
    
    setCurrentLine(position.lineNumber);
    setCurrentColumn(position.column);
    
    // Solo anunciar cambios de línea (no cada movimiento de columna)
    if (Math.abs(position.lineNumber - currentLine) >= 1) {
      const lineContent = model.getLineContent(position.lineNumber);
      announce(`Línea ${position.lineNumber}`);
    }
  }, [currentLine, announce]);

  const handleSendFile = useCallback(() => {
    if (!editorContent.trim()) {
      console.error('No hay código para ejecutar.');
      setOutput([{ prompt: '', text: 'Error: No hay código para ejecutar', color: '#ff5555' }]);
      speak('Error: No hay código para ejecutar');
      return;
    }

    // Si ya hay una ejecución en curso, no iniciar otra
    if (isExecuting) {
      speak('Ya hay una ejecución en curso. Usa F7 para detener o F8 para cancelar.');
      return;
    }

    setIsExecuting(true);
    setIsLoading(true);
    setOutput([{ prompt: '', text: 'Conectando...', color: '#8be9fd' }]);
    speak('Conectando con el servidor');

    const wsUrl = 'wss://backend-g1zl.onrender.com/ws/terminal/';
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket conectado');
      setOutput([{ prompt: '', text: 'Ejecutando código...', color: '#8be9fd' }]);
      speak('Ejecutando código');
      
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
            ws.send(JSON.stringify({
              action: 'run',
              entrypoint: 'main.py',
              timeout: 60
            }));
            break;
            
          case 'started':
            setPid(data.pid);
            setOutput(prev => [...prev, { prompt: '', text: `Proceso iniciado (PID: ${data.pid})`, color: '#50fa7b' }]);
            speak(`Proceso iniciado con PID ${data.pid}`);
            break;
            
          case 'output':
            setOutput(prev => [...prev, { 
              prompt: '', 
              text: data.data,
              color: data.stream === 'stderr' ? '#ff5555' : '#ffffff'
            }]);
            break;
            
          case 'execution_finished':
            setIsExecuting(false);
            setIsLoading(false);
            setOutput(prev => [...prev, { 
              prompt: '', 
              text: `\nProceso finalizado (código: ${data.exit_code})`,
              color: data.exit_code === 0 ? '#50fa7b' : '#ff5555'
            }]);
            speak(data.exit_code === 0 ? 'Ejecución completada exitosamente' : `Ejecución finalizada con errores, código ${data.exit_code}`);
            break;
            
          case 'timeout':
            setIsExecuting(false);
            setIsLoading(false);
            setOutput(prev => [...prev, { prompt: '', text: '\nTimeout: El proceso excedió el tiempo límite', color: '#ff5555' }]);
            speak('Tiempo de ejecución excedido');
            break;
            
          case 'error':
            setIsExecuting(false);
            setIsLoading(false);
            setOutput(prev => [...prev, { prompt: '', text: `Error: ${data.message}`, color: '#ff5555' }]);
            speak(`Error: ${data.message}`);
            break;

          case 'killed':
            setIsExecuting(false);
            setIsLoading(false);
            setOutput(prev => [...prev, { prompt: '', text: '\nProceso terminado por el usuario', color: '#ffaa00' }]);
            speak('Proceso terminado por el usuario');
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
      setIsExecuting(false);
      setIsLoading(false);
      setOutput(prev => [...prev, { prompt: '', text: 'Error de conexión WebSocket', color: '#ff5555' }]);
      speak('Error de conexión con el servidor');
    };

    ws.onclose = (event) => {
      console.log('WebSocket desconectado', event.code, event.reason);
      setWsInstance(null);
      if (isExecuting) {
        setIsExecuting(false);
        setIsLoading(false);
      }
    };

    setWsInstance(ws);
  }, [editorContent, speak, setPid, setOutput, isExecuting]);

  const handleStopExecution = useCallback(() => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify({
        action: 'kill',
        signal: 'SIGTERM'
      }));
      speak('Enviando señal de detención al proceso');
      setOutput(prev => [...prev, { prompt: '', text: 'Deteniendo proceso...', color: '#ffaa00' }]);
    } else {
      speak('No hay proceso en ejecución');
    }
  }, [wsInstance, speak, setOutput]);

  const handleCancelTranscription = useCallback(() => {
    if (isRecording) {
      // Marcar como cancelada ANTES de detener
      transcriptionCancelledRef.current = true;
      
      // Cancelar la petición HTTP si está en curso
      if (transcriptionControllerRef.current) {
        transcriptionControllerRef.current.abort();
        transcriptionControllerRef.current = null;
      }
      
      // Detener el MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Detener todos los tracks del stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Limpiar chunks de audio
      audioChunksRef.current = [];
      
      // Resetear estado
      setIsRecording(false);
      mediaRecorderRef.current = null;
      
      speak('Transcripción cancelada');
    }
  }, [isRecording, speak]);

  const handleCancelExecution = useCallback(() => {
    if (wsInstance) {
      // Enviar señal SIGKILL
      if (wsInstance.readyState === WebSocket.OPEN) {
        try {
          wsInstance.send(JSON.stringify({
            action: 'kill',
            signal: 'SIGKILL'
          }));
        } catch (e) {
          console.error('Error enviando SIGKILL:', e);
        }
      }
      
      // Cerrar el WebSocket
      wsInstance.close(1000, 'Cancelado por el usuario');
      setWsInstance(null);
      setIsExecuting(false);
      setIsLoading(false);
      setPid(null);
      setOutput(prev => [...prev, { prompt: '', text: '\nEjecución cancelada por el usuario', color: '#ff5555' }]);
      speak('Ejecución cancelada');
    } else if (isRecording) {
      // Cancelar transcripción si está activa
      handleCancelTranscription();
    } else {
      speak('No hay operación en curso para cancelar');
    }
  }, [wsInstance, speak, setOutput, setPid, isRecording, handleCancelTranscription]);

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

  const handleTranscription = useCallback(async () => {
    if (!isRecording) {
      try {
        // Resetear flag de cancelación al iniciar nueva grabación
        transcriptionCancelledRef.current = false;
        
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
          // Detener tracks del stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          setIsRecording(false);
          
          // Si fue cancelada, no procesar nada
          if (transcriptionCancelledRef.current) {
            console.log('Transcripción cancelada, no se procesará el audio');
            audioChunksRef.current = [];
            transcriptionCancelledRef.current = false;
            return;
          }
          
          // Si no hay chunks de audio, no procesar
          if (audioChunksRef.current.length === 0) {
            speak('No se grabó audio');
            return;
          }
          
          speak('Procesando transcripción');
  
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.wav');
  
          // Crear AbortController para poder cancelar la petición
          transcriptionControllerRef.current = new AbortController();
  
          try {
            const response = await axiosInstance.post('transcribe/', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              signal: transcriptionControllerRef.current.signal
            });
  
            // Verificar nuevamente si fue cancelada durante la petición
            if (transcriptionCancelledRef.current) {
              console.log('Transcripción cancelada durante procesamiento');
              return;
            }
  
            const code = response.data.code;
            if (code) {
              setEditorContent(prev => prev + '\n' + code);
              handleAnalyzeStructure(code);
              speak('Código transcrito e insertado en el editor');
            } else {
              speak('No se pudo transcribir código del audio');
            }
          } catch (err) {
            // Si fue cancelada por AbortController
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
              console.log('Petición de transcripción cancelada');
              return;
            }
            console.error('Error al enviar audio:', err);
            speak('Error al transcribir el audio');
          } finally {
            transcriptionControllerRef.current = null;
            audioChunksRef.current = [];
          }
        };
  
        mediaRecorder.start();
        setIsRecording(true);
        speak('Grabación iniciada. Presiona F6 de nuevo para detener o F8 para cancelar.');
      } catch (error) {
        console.error('Error accediendo al micrófono:', error);
        speak('Error al acceder al micrófono');
        transcriptionCancelledRef.current = false;
      }
    } else {
      // Detener grabación y procesar (no cancelar)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        speak('Grabación detenida, procesando...');
      }
    }
  }, [isRecording, speak, setEditorContent]);


  const readCurrentLine = useCallback(() => {
    if (!editorRef.current) return;
    
    const model = editorRef.current.getModel();
    const position = editorRef.current.getPosition();
    
    if (!model || !position) return;
    
    const lineContent = model.getLineContent(position.lineNumber);
    const lineNumber = position.lineNumber;
    
    // Leer número de línea y contenido
    const textToRead = lineContent.trim() 
      ? `Línea ${lineNumber}: ${lineContent}` 
      : `Línea ${lineNumber} vacía`;
    
    speak(textToRead);
    setCurrentLine(lineNumber);
    setCurrentColumn(position.column);
  }, [speak]);

  const readSelectionOrLine = useCallback(() => {
    if (!editorRef.current) return;
    
    const model = editorRef.current.getModel();
    const selection = editorRef.current.getSelection();
    
    if (!model || !selection) return;
    
    // Si hay texto seleccionado
    if (!selection.isEmpty()) {
      const selectedText = model.getValueInRange(selection);
      
      if (selectedText.trim()) {
        // Si la selección es de múltiples líneas
        const lineCount = selection.endLineNumber - selection.startLineNumber + 1;
        if (lineCount > 1) {
          speak(`Selección de ${lineCount} líneas: ${selectedText}`);
        } else {
          speak(`Texto seleccionado: ${selectedText}`);
        }
      } else {
        speak('Selección vacía');
      }
    } else {
      // Si no hay selección, leer la línea actual
      readCurrentLine();
    }
  }, [speak, readCurrentLine]);

  // Función para leer palabra bajo el cursor
  const readWordAtCursor = useCallback(() => {
    if (!editorRef.current) return;
    
    const model = editorRef.current.getModel();
    const position = editorRef.current.getPosition();
    
    if (!model || !position) return;
    
    const wordAtPosition = model.getWordAtPosition(position);
    
    if (wordAtPosition) {
      speak(`Palabra: ${wordAtPosition.word}`);
    } else {
      speak('Sin palabra en la posición del cursor');
    }
  }, [speak]);

  // Función para leer todo el contenido del editor
  const readAllContent = useCallback(() => {
    if (!editorRef.current) return;
    
    const model = editorRef.current.getModel();
    if (!model) return;
    
    const content = model.getValue();
    
    if (content.trim()) {
      speak(`Contenido del editor. Total de líneas: ${model.getLineCount()}. ${content}`);
    } else {
      speak('El editor está vacío');
    }
  }, [speak]);

  // Función para ir a una línea específica
  const goToLine = useCallback((lineNumber) => {
    if (!editorRef.current) return;
    
    const model = editorRef.current.getModel();
    if (!model) return;
    
    const totalLines = model.getLineCount();
    
    if (lineNumber < 1 || lineNumber > totalLines) {
      speak(`Número de línea inválido. El rango es de 1 a ${totalLines}`);
      return;
    }
    
    editorRef.current.setPosition({ lineNumber, column: 1 });
    editorRef.current.revealLineInCenter(lineNumber);
    
    const lineContent = model.getLineContent(lineNumber);
    speak(`Movido a línea ${lineNumber}: ${lineContent || 'vacía'}`);
  }, [speak]);

  // Función para leer información del cursor
  const readCursorInfo = useCallback(() => {
    if (!editorRef.current) return;
    
    const position = editorRef.current.getPosition();
    if (!position) return;
    
    speak(`Cursor en línea ${position.lineNumber}, columna ${position.column}`);
  }, [speak]);

  // Registrar componente en el sistema de navegación
  useEffect(() => {
    const editorApi = {
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
          speak('Editor de código enfocado');
          readCurrentLine();
        }
      },
      blur: () => {
        if (editorRef.current) {
          announce('Saliendo del editor');
        }
      },
      readLine: readSelectionOrLine, // CAMBIO: usar la nueva función
      readWord: readWordAtCursor,
      readAll: readAllContent,
      goToLine: goToLine,
      readCursor: readCursorInfo,
      execute: handleSendFile,
      save: onSave,
      transcribe: handleTranscription
    };

    registerComponent('editor', editorApi);

    return () => {
      unregisterComponent('editor');
    };
  }, [
    registerComponent, 
    unregisterComponent, 
    speak, 
    announce,
    readSelectionOrLine, // CAMBIO
    readWordAtCursor,
    readAllContent,
    goToLine,
    readCursorInfo,
    handleSendFile,
    onSave
  ]);

  // Manejador de teclado del editor
  const handleEditorKeyDown = useCallback((event) => {
    // Ctrl+L: Leer línea actual o selección
    if (event.ctrlKey && event.key === 'l') {
      event.preventDefault();
      readSelectionOrLine();
      return;
    }

    // Ctrl+K: Leer palabra bajo cursor (MANTENER)
    if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      readWordAtCursor();
      return;
    }

    // Ctrl+Shift+L: Leer todo el contenido (MANTENER)
    if (event.ctrlKey && event.shiftKey && event.key === 'L') {
      event.preventDefault();
      readAllContent();
      return;
    }

    // Ctrl+G: Ir a línea (MANTENER)
    if (event.ctrlKey && event.key === 'g') {
      event.preventDefault();
      const lineNumber = prompt('Ir a línea número:');
      if (lineNumber) {
        goToLine(parseInt(lineNumber, 10));
      }
      return;
    }

    // Ctrl+I: Información del cursor (MANTENER)
    if (event.ctrlKey && event.key === 'i') {
      event.preventDefault();
      readCursorInfo();
      return;
    }

    // F5: Ejecutar código (MANTENER)
    if (event.key === 'F5') {
      event.preventDefault();
      handleSendFile();
      speak('Ejecutando código');
      return;
    }

    // Alt+S: Guardar archivo (MANTENER)
    if (event.altKey && event.key === 's') {
      event.preventDefault();
      if (onSave) {
        onSave();
      }
      return;
    }

    // Ctrl+Shift+V: Transcribir voz (MANTENER)
    if (event.ctrlKey && event.shiftKey && event.key === 'V') {
      event.preventDefault();
      handleTranscription();
      return;
    }

    // Anunciar navegación con flechas - SIMPLIFICADO
    if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
      setTimeout(() => {
        const model = editorRef.current?.getModel();
        const position = editorRef.current?.getPosition();
        if (model && position) {
          const lineContent = model.getLineContent(position.lineNumber);
          // Solo anunciar el número de línea brevemente
          announce(`Línea ${position.lineNumber}`);
        }
      }, 50);
    }
  }, [
    readSelectionOrLine,
    readWordAtCursor,
    readAllContent,
    goToLine,
    readCursorInfo,
    handleSendFile,
    onSave,
    handleTranscription,
    speak,
    announce
  ]);

  // Función imperativa para acceder desde fuera
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
        speak('Editor de código enfocado');
        readCurrentLine();
      }
    },
    readLine: readSelectionOrLine, 
    readWord: readWordAtCursor,
    readAll: readAllContent,
    goToLine: goToLine,
  }), [
    wsInstance, 
    currentFileName, 
    editorContent, 
    speak, 
    readSelectionOrLine, 
    readWordAtCursor,
    readAllContent,
    goToLine
  ]);

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

  // Escuchar eventos globales de ejecución
  useEffect(() => {
    const handleExecuteEvent = () => {
      handleSendFile();
    };

    const handleTranscribeEvent = () => {
      handleTranscription();
    };

    const handleStopEvent = () => {
      handleStopExecution();
    };

    const handleCancelEvent = () => {
      handleCancelExecution();
    };

    window.addEventListener('codeflow-execute', handleExecuteEvent);
    window.addEventListener('codeflow-transcribe', handleTranscribeEvent);
    window.addEventListener('codeflow-stop', handleStopEvent);
    window.addEventListener('codeflow-cancel', handleCancelEvent);

    return () => {
      window.removeEventListener('codeflow-execute', handleExecuteEvent);
      window.removeEventListener('codeflow-transcribe', handleTranscribeEvent);
      window.removeEventListener('codeflow-stop', handleStopEvent);
      window.removeEventListener('codeflow-cancel', handleCancelEvent);
    };
  }, [handleSendFile, handleTranscription, handleStopExecution, handleCancelExecution]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      // Cancelar cualquier transcripción en curso
      if (transcriptionControllerRef.current) {
        transcriptionControllerRef.current.abort();
      }
      // Detener stream de audio
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Cerrar WebSocket
      if (wsInstance) {
        wsInstance.close();
      }
    };
  }, [wsInstance]);

  // Registrar componente en el sistema de navegación
  useEffect(() => {
    const editorApi = {
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
          speak('Editor de código enfocado');
          readCurrentLine();
        }
      },
      blur: () => {
        if (editorRef.current) {
          announce('Saliendo del editor');
        }
      },
      readLine: readSelectionOrLine,
      readWord: readWordAtCursor,
      readAll: readAllContent,
      goToLine: goToLine,
      readCursor: readCursorInfo,
      execute: handleSendFile,
      save: onSave,
      transcribe: handleTranscription,
      stop: handleStopExecution,
      cancel: handleCancelExecution
    };

    registerComponent('editor', editorApi);

    return () => {
      unregisterComponent('editor');
    };
  }, [
    registerComponent, 
    unregisterComponent, 
    speak, 
    announce,
    readSelectionOrLine,
    readWordAtCursor,
    readAllContent,
    goToLine,
    readCursorInfo,
    handleSendFile,
    onSave,
    handleTranscription,
    handleStopExecution,
    handleCancelExecution
  ]);
  
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
          color={isExecuting ? "warning" : "success"}
          onClick={isExecuting ? handleStopExecution : handleSendFile} 
          aria-label={isExecuting ? "Detener ejecución (F7)" : "Ejecutar archivo (F5)"}
          title={isExecuting ? "Detener (F7)" : "Ejecutar (F5)"}
          style={{ flex: '1 1 auto', minWidth: '120px' }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : (isExecuting ? 'Detener' : 'Ejecutar')}
        </Button>
        <Button
          variant="contained"
          size="small"
          color={isRecording ? "error" : "info"}
          onClick={handleTranscription}
          aria-label={isRecording ? "Detener grabación (F6)" : "Iniciar transcripción (F6)"}
          title={isRecording ? "Detener (F6)" : "Transcribir (F6)"}
          style={{ flex: '1 1 auto', minWidth: '120px' }}
        >
          {isRecording ? 'Detener' : 'Transcribir'}
        </Button>
        {(isRecording || isExecuting) && (
          <Button 
            size="small" 
            color="error"
            variant="outlined"
            onClick={handleCancelExecution}
            aria-label="Cancelar operación (F8)"
            title="Cancelar (F8)"
            style={{ flex: '1 1 auto', minWidth: '100px' }}
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
              renderWhitespace: contrast === 'high-contrast' ? 'boundary' : 'none',
              guides: {
                indentation: true,
                highlightActiveIndentation: true,
              },
              ariaLabel: 'Editor de código Python',
            }}
            theme={getEditorTheme(contrast)}
            onMount={(editor) => {
              editorRef.current = editor;
              editor.onDidChangeCursorPosition(handleCursorChange);
              editor.onMouseDown(handleBreakpointClick);
              
              // Agregar manejador de teclado al editor
              editor.onKeyDown(handleEditorKeyDown);
            }}
          />
        </Box>
      </Box>
    </Box>
  );
});

export default TextEditor;
