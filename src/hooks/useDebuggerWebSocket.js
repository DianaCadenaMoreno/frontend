import { useEffect, useRef, useState, useCallback } from 'react';

export const useDebuggerWebSocket = (onMessage) => {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [debugState, setDebugState] = useState({
    isDebugging: false,
    currentLine: null,
    currentFile: null,
    variables: {},
    breakpoints: [],
    error: null
  });

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      //const ws = new WebSocket('ws://localhost/ws/debugger/');
      const ws = new WebSocket('wss://https://backend-g1zl.onrender.com/ws/debugger/');
      
      ws.onopen = () => {
        console.log('✅ WebSocket debugger conectado');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Mensaje del debugger:', data);
          
          handleDebugMessage(data);
          
          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('Error procesando mensaje:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Error en WebSocket debugger:', error);
        setDebugState(prev => ({
          ...prev,
          error: 'Error de conexión con el debugger'
        }));
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket debugger desconectado');
        setIsConnected(false);
        setDebugState(prev => ({
          ...prev,
          isDebugging: false
        }));
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
    }
  }, [onMessage]);

  const handleDebugMessage = useCallback((data) => {
    switch (data.type) {
      case 'debug_started':
        setDebugState(prev => ({
          ...prev,
          isDebugging: true,
          currentFile: data.file,
          breakpoints: data.breakpoints || [],
          error: null
        }));
        break;

      case 'breakpoint_hit':
        setDebugState(prev => ({
          ...prev,
          currentLine: data.line,
          currentFile: data.file,
          variables: data.variables || {}
        }));
        break;

      case 'breakpoint_set':
        setDebugState(prev => ({
          ...prev,
          breakpoints: [...prev.breakpoints, `${data.file}:${data.line}`]
        }));
        break;

      case 'breakpoint_removed':
        setDebugState(prev => ({
          ...prev,
          breakpoints: prev.breakpoints.filter(
            bp => bp !== `${data.file}:${data.line}`
          )
        }));
        break;

      case 'variables':
        setDebugState(prev => ({
          ...prev,
          variables: data.data || {}
        }));
        break;

      case 'evaluation_result':
        setDebugState(prev => ({
          ...prev,
          lastEvaluation: {
            expression: data.expression,
            result: data.result
          }
        }));
        break;

      case 'debug_stopped':
      case 'debug_finished':
        setDebugState(prev => ({
          ...prev,
          isDebugging: false,
          currentLine: null,
          currentFile: null
        }));
        break;

      case 'debug_error':
      case 'error':
        setDebugState(prev => ({
          ...prev,
          error: data.message || data.error
        }));
        break;

      default:
        console.log('Tipo de mensaje no manejado:', data.type);
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket no está conectado');
    }
  }, []);

  // Métodos del debugger
  const uploadFiles = useCallback((files) => {
    sendMessage({
      action: 'upload_files',
      files: files
    });
  }, [sendMessage]);

  const startDebug = useCallback((entrypoint) => {
    sendMessage({
      action: 'start_debug',
      entrypoint: entrypoint
    });
  }, [sendMessage]);

  const setBreakpoint = useCallback((file, line) => {
    sendMessage({
      action: 'set_breakpoint',
      file: file,
      line: line
    });
  }, [sendMessage]);

  const removeBreakpoint = useCallback((file, line) => {
    sendMessage({
      action: 'remove_breakpoint',
      file: file,
      line: line
    });
  }, [sendMessage]);

  const step = useCallback(() => {
    sendMessage({ action: 'step' });
  }, [sendMessage]);

  const stepInto = useCallback(() => {
    sendMessage({ action: 'step_into' });
  }, [sendMessage]);

  const stepOver = useCallback(() => {
    sendMessage({ action: 'step_over' });
  }, [sendMessage]);

  const continueExecution = useCallback(() => {
    sendMessage({ action: 'continue' });
  }, [sendMessage]);

  const getVariables = useCallback(() => {
    sendMessage({ action: 'get_variables' });
  }, [sendMessage]);

  const evaluateExpression = useCallback((expression) => {
    sendMessage({
      action: 'evaluate',
      expression: expression
    });
  }, [sendMessage]);

  const stopDebug = useCallback(() => {
    sendMessage({ action: 'stop_debug' });
  }, [sendMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    debugState,
    uploadFiles,
    startDebug,
    setBreakpoint,
    removeBreakpoint,
    step,
    stepInto,
    stepOver,
    continueExecution,
    getVariables,
    evaluateExpression,
    stopDebug,
    disconnect
  };
};