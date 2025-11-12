import { useEffect, useRef, useState, useCallback } from 'react';

export const useDebuggerWebSocket = (onMessage) => {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [debugState, setDebugState] = useState({
    isDebugging: false,
    currentLine: null,
    currentFile: null,
    currentCode: null,
    function: null,
    variables: {
      locals: {},
      globals: {},
      instance: {}
    },
    breakpoints: [],
    error: null,
    lastEvaluation: null,
    stackDepth: 0,
    exception: null
  });

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      //const ws = new WebSocket('ws://localhost/ws/debugger/');
      const ws = new WebSocket('wss://backend-g1zl.onrender.com/ws/debugger/');
      
      ws.onopen = () => {
        console.log('WebSocket debugger conectado');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Mensaje del debugger:', data);
          
          handleDebugMessage(data);
          
          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('Error procesando mensaje:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Error en WebSocket debugger:', error);
        setDebugState(prev => ({
          ...prev,
          error: 'Error de conexión con el debugger'
        }));
      };

      ws.onclose = () => {
        console.log('WebSocket debugger desconectado');
        setIsConnected(false);
        setDebugState(prev => ({
          ...prev,
          isDebugging: false,
          currentLine: null,
          currentFile: null,
          variables: { locals: {}, globals: {}, instance: {} }
        }));
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
    }
  }, [onMessage]);

  const handleDebugMessage = useCallback((data) => {
    switch (data.type) {
      case 'info':
        console.log('Info:', data.message);
        break;

      case 'debug_started':
        console.log('Debug iniciado:', data.file);
        setDebugState(prev => ({
          ...prev,
          isDebugging: true,
          currentFile: data.file,
          breakpoints: data.breakpoints || [],
          error: null
        }));
        break;

      case 'breakpoint_hit':
        console.log('Breakpoint alcanzado:', data.line);
        setDebugState(prev => ({
          ...prev,
          currentLine: data.line,
          currentFile: data.file,
          currentCode: data.code,
          function: data.function,
          variables: {
            locals: data.variables?.locals || {},
            globals: data.variables?.globals || {},
            instance: data.variables?.instance || {}
          },
          stackDepth: data.stack_depth || 0
        }));
        break;

      case 'function_return':
        console.log(`Función ${data.function} retornó:`, data.value);
        break;

      case 'breakpoint_set':
        console.log('Breakpoint configurado:', `${data.file}:${data.line}`);
        setDebugState(prev => ({
          ...prev,
          breakpoints: [...new Set([...prev.breakpoints, `${data.file}:${data.line}`])]
        }));
        break;

      case 'breakpoint_removed':
        console.log('Breakpoint eliminado:', `${data.file}:${data.line}`);
        setDebugState(prev => ({
          ...prev,
          breakpoints: prev.breakpoints.filter(
            bp => bp !== `${data.file}:${data.line}`
          )
        }));
        break;

      case 'variables':
        console.log('Variables actualizadas');
        setDebugState(prev => ({
          ...prev,
          variables: {
            locals: data.data?.locals || {},
            globals: data.data?.globals || {},
            instance: data.data?.instance || {}
          }
        }));
        break;

      case 'evaluation_result':
        console.log('Resultado evaluación:', data.result);
        setDebugState(prev => ({
          ...prev,
          lastEvaluation: {
            expression: data.expression,
            result: data.result
          }
        }));
        break;

      case 'debug_stopped':
        console.log('Debug detenido');
        setDebugState(prev => ({
          ...prev,
          isDebugging: false,
          currentLine: null,
          currentFile: null,
          currentCode: null,
          variables: { locals: {}, globals: {}, instance: {} }
        }));
        break;

      case 'debug_finished':
        console.log('Debug completado');
        setDebugState(prev => ({
          ...prev,
          isDebugging: false,
          currentLine: null,
          currentFile: null,
          currentCode: null
        }));
        break;

      case 'debug_error':
        console.error('Excepción durante depuración:', data);
        
        //  Solo actualizar si no hay excepción previa
        setDebugState(prev => {
          if (prev.exception) {
            console.log('Ignorando excepción duplicada');
            return prev; // No actualizar si ya hay una excepción
          }
          
          return {
            ...prev,
            exception: {
              type: data.exception_type,
              message: data.error,
              line: data.line,
              file: data.file
            },
            error: `${data.exception_type}: ${data.error}`,
            isDebugging: false,
            currentLine: data.line, 
            currentFile: data.file 
          };
        });
        break;
        
      case 'error':
        console.error('Error:', data.message || data.error);
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
      console.log('Enviando:', message);
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
    setDebugState,
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