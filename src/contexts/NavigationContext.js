import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const NavigationContext = createContext();

export const useAppNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation debe usarse dentro de NavigationProvider');
  }
  return context;
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const NavigationProvider = ({ children }) => {
  const [focusedComponent, setFocusedComponent] = useState(null);
  const [listeningForCommands, setListeningForCommands] = useState(true);
  const recognitionRef = useRef(null);
  const componentRefs = useRef({});
  const isRestartingRef = useRef(false);
  const restartTimeoutRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Registrar componente
  const registerComponent = useCallback((name, ref) => {
    componentRefs.current[name] = ref;
    // console.log(`Componente registrado: ${name}`, ref);
  }, []);

  // Desregistrar componente
  const unregisterComponent = useCallback((name) => {
    delete componentRefs.current[name];
    // console.log(`Componente desregistrado: ${name}`);
  }, []);

  // Enfocar componente
  const focusComponent = useCallback((componentName) => {
    console.log('Intentando enfocar:', componentName);
    console.log('Componentes registrados:', Object.keys(componentRefs.current));

    // Desenfocar el componente anterior si existe
    if (previousFocusRef.current && previousFocusRef.current !== componentName) {
      const previousComponent = componentRefs.current[previousFocusRef.current];
      if (previousComponent && previousComponent.blur) {
        console.log(`Desenfocando componente anterior: ${previousFocusRef.current}`);
        previousComponent.blur();
      }
    }
    
    const component = componentRefs.current[componentName];
    if (component) {
      console.log('Componente encontrado:', componentName, component);
      if (component.focus) {
        component.focus();
        setFocusedComponent(componentName);
        previousFocusRef.current = componentName; // Guardar como anterior
        console.log(`Componente enfocado: ${componentName}`);
        return true;
      } else {
        console.warn(`El componente ${componentName} no tiene método focus`);
      }
    } else {
      console.warn(`Componente no encontrado: ${componentName}`);
    }
    return false;
  }, []);

  // Comandos de voz disponibles
  const voiceCommands = {
    // Navegación principal
    'barra de navegación': 'navbar',
    'navegación': 'navbar',
    'menú archivos': 'navbar-archivos',
    'archivos menú': 'navbar-archivos',
    'menú ajustes': 'navbar-ajustes',
    'ajustes menú': 'navbar-ajustes',
    'menú ayuda': 'navbar-ayuda',
    'ayuda menú': 'navbar-ayuda',
    
    // FileManager
    'gestor de archivos': 'filemanager',
    'archivos': 'filemanager',
    'administrador de archivos': 'filemanager',
    'crear archivo': 'filemanager-create-file',
    'nuevo archivo': 'filemanager-create-file',
    'crear carpeta': 'filemanager-create-folder',
    'nueva carpeta': 'filemanager-create-folder',
    'abrir archivo': 'filemanager-open-file',
    'abrir carpeta': 'filemanager-open-folder',
    'chat': 'filemanager-chat',
    'copiloto': 'filemanager-chat',
    'asistente': 'filemanager-chat',
    'estructura': 'filemanager-structure',
    'estructura del código': 'filemanager-structure',
    
    // Editor
    'editor': 'editor',
    'código': 'editor',
    'editor de código': 'editor',
    
    // Terminal
    'terminal': 'terminal',
    'consola': 'terminal',
    
    // Accesibilidad
    'alto contraste': 'toggle-contrast',
    'contraste': 'toggle-contrast',
    'lector de pantalla': 'toggle-screen-reader',
    'lector': 'toggle-screen-reader',
    'ampliar': 'zoom-in',
    'aumentar': 'zoom-in',
    'reducir': 'zoom-out',
    'disminuir': 'zoom-out',
    'ayuda': 'show-help',
    'ayuda de navegación': 'show-help',

    // Navegación a Welcome
    'guía': 'welcome',
    'bienvenida': 'welcome',
    'ayuda inicial': 'welcome',
    'pantalla de bienvenida': 'welcome',

    // Comandos de ejecución y transcripción
    'ejecutar': 'editor-execute',
    'ejecutar código': 'editor-execute',
    'correr código': 'editor-execute',
    'correr': 'editor-execute',
    'run': 'editor-execute',
    'transcribir': 'editor-transcribe',
    'transcripción': 'editor-transcribe',
    'dictar': 'editor-transcribe',
    'voz a código': 'editor-transcribe',
    'detener': 'editor-stop',
    'parar': 'editor-stop',
    'stop': 'editor-stop',
    'detener ejecución': 'editor-stop',
    'cancelar': 'editor-cancel',
    'abortar': 'editor-cancel',
    'cancelar ejecución': 'editor-cancel',
    'guardar': 'save-file',
    'guardar archivo': 'save-file',
  };

  // componentRefs.current directamente
  const handleCommand = useCallback((action) => {
    console.log(`Ejecutando comando: ${action}`);
    console.log('Componentes registrados disponibles:', Object.keys(componentRefs.current));
    
    // Manejar comandos 
    switch(action) {
      case 'toggle-contrast':
        window.dispatchEvent(new CustomEvent('codeflow-toggle-contrast'));
        return;
      case 'toggle-screen-reader':
        window.dispatchEvent(new CustomEvent('codeflow-toggle-screenreader'));
        return;
      case 'zoom-in':
        window.dispatchEvent(new CustomEvent('codeflow-zoom-in'));
        return;
      case 'zoom-out':
        window.dispatchEvent(new CustomEvent('codeflow-zoom-out'));
        return;
      case 'show-help':
        window.dispatchEvent(new CustomEvent('codeflow-show-help'));
        return;
      case 'welcome':
        window.dispatchEvent(new CustomEvent('codeflow-show-welcome'));
        return;
      case 'save-file':
        window.dispatchEvent(new CustomEvent('codeflow-save-file'));
        return;
      case 'editor-execute':
        window.dispatchEvent(new CustomEvent('codeflow-execute'));
        return;
      case 'editor-transcribe':
        window.dispatchEvent(new CustomEvent('codeflow-transcribe'));
        return;
      case 'editor-stop':
        window.dispatchEvent(new CustomEvent('codeflow-stop'));
        return;
      case 'editor-cancel':
        window.dispatchEvent(new CustomEvent('codeflow-cancel'));
        return;
      default:
        break;
    }
    
    const [component, subAction] = action.split('-');
    
    // Buscar el componente directamente en la ref
    const componentRef = componentRefs.current[action] || componentRefs.current[component];
    
    if (componentRef) {
      console.log(`Componente encontrado para ${action}:`, componentRef);
      
      // Si hay una subacción y el componente la tiene como método
      if (subAction && componentRef[subAction]) {
        console.log(`Ejecutando subacción: ${subAction}`);
        componentRef[subAction]();
      } 
      // Si es el componente completo y tiene focus
      else if (componentRef.focus) {
        console.log(`Ejecutando focus en: ${component}`);
        componentRef.focus();
        setFocusedComponent(component);
      }
      else {
        console.warn(`El componente ${action} no tiene método focus ni subacción ${subAction}`);
      }
    } else {
      console.error(`No se encontró el componente para el comando: ${action}`);
      console.log('Buscando en:', action, 'o', component);
      console.log('Refs disponibles:', Object.keys(componentRefs.current));
    }
  }, []);

  // Procesar comando de voz
  const processVoiceCommand = useCallback((command) => {
    const normalizedCommand = command.toLowerCase().trim();
    console.log(`Procesando comando: "${normalizedCommand}"`);
    
    // Buscar coincidencia exacta o parcial
    for (const [key, action] of Object.entries(voiceCommands)) {
      if (normalizedCommand.includes(key)) {
        console.log(`✓ Comando encontrado: "${key}" -> ${action}`);
        handleCommand(action);
        return true;
      }
    }
    
    console.log('✗ Comando no reconocido:', normalizedCommand);
    console.log('Comandos disponibles:', Object.keys(voiceCommands));
    return false;
  }, [handleCommand, voiceCommands]);

  // Función para iniciar el reconocimiento de voz
  const startRecognition = useCallback(() => {
    if (!SpeechRecognition || !listeningForCommands || isRestartingRef.current) {
      return;
    }

    // Limpiar timeout anterior si existe
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    try {
      // Si ya hay una instancia, detenerla primero
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignorar errores al abortar
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Reconocimiento de voz iniciado');
        isRestartingRef.current = false;
      };

      recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript;
        const confidence = event.results[last][0].confidence;
        
        console.log(`🎤 Comando detectado: "${command}" (confianza: ${confidence.toFixed(2)})`);
        
        if (confidence > 0.3) { // Reducir umbral para mejor detección
          processVoiceCommand(command);
        } else {
          console.log('Comando ignorado por baja confianza');
        }
      };

      recognition.onerror = (event) => {
        console.error('Error en reconocimiento de voz:', event.error);
        
        // Solo reintentar en ciertos tipos de errores
        if (['aborted', 'no-speech', 'audio-capture', 'network'].includes(event.error)) {
          if (listeningForCommands && !isRestartingRef.current) {
            isRestartingRef.current = true;
            restartTimeoutRef.current = setTimeout(() => {
              console.log('Reintentando iniciar reconocimiento...');
              startRecognition();
            }, 1000);
          }
        }
      };

      recognition.onend = () => {
        console.log('Reconocimiento de voz finalizado');
        
        // Reiniciar automáticamente si está habilitado
        if (listeningForCommands && !isRestartingRef.current) {
          isRestartingRef.current = true;
          restartTimeoutRef.current = setTimeout(() => {
            console.log('Reiniciando reconocimiento automáticamente...');
            startRecognition();
          }, 500);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      console.log('Intentando iniciar reconocimiento de voz...');
      
    } catch (error) {
      console.error('Error al configurar reconocimiento de voz:', error);
      
      // Reintentar después de un error de inicio
      if (listeningForCommands && !isRestartingRef.current) {
        isRestartingRef.current = true;
        restartTimeoutRef.current = setTimeout(() => {
          startRecognition();
        }, 2000);
      }
    }
  }, [listeningForCommands, processVoiceCommand]);

  // Función para detener el reconocimiento
  const stopRecognition = useCallback(() => {
    console.log('Deteniendo reconocimiento de voz...');
    isRestartingRef.current = false;
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error al detener reconocimiento:', error);
      }
      recognitionRef.current = null;
    }
  }, []);

  // Efecto para controlar el reconocimiento de voz
  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition no está disponible en este navegador');
      return;
    }

    if (listeningForCommands) {
      console.log('Activando comandos de voz...');
      startRecognition();
    } else {
      console.log('Desactivando comandos de voz...');
      stopRecognition();
    }

    return () => {
      stopRecognition();
    };
  }, [listeningForCommands, startRecognition, stopRecognition]);

  // Manejador global de teclado
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // Alt + B para volver a Welcome 
      if (event.altKey && (event.key === 'b' || event.key === 'B')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atajo: Alt+B - Welcome');
        window.dispatchEvent(new CustomEvent('codeflow-show-welcome'));
        return;
      }

      // Alt + L para alternar lector de pantalla
      if (event.altKey && (event.key === 'l' || event.key === 'L')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atajo: Alt+L - Toggle Screen Reader');
        window.dispatchEvent(new CustomEvent('codeflow-toggle-screenreader'));
        return;
      }

      // Alt + C para alternar contraste
      if (event.altKey && !event.ctrlKey && (event.key === 'c' || event.key === 'C')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atajo: Alt+C - Toggle Contraste');
        window.dispatchEvent(new CustomEvent('codeflow-toggle-contrast'));
        return;
      }

      // Alt + + para zoom in (también = porque + está en la misma tecla)
      if (event.altKey && (event.key === '+' || event.key === '=' || event.key === 'Add')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atajo: Alt++ - Zoom In');
        window.dispatchEvent(new CustomEvent('codeflow-zoom-in'));
        return;
      }

      // Alt + - para zoom out
      if (event.altKey && (event.key === '-' || event.key === 'Subtract')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atajo: Alt+- - Zoom Out');
        window.dispatchEvent(new CustomEvent('codeflow-zoom-out'));
        return;
      }

      // Alt + S para guardar archivo (solo si hay archivo abierto)
      if (event.altKey && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atajo: Alt+S - Guardar archivo');
        window.dispatchEvent(new CustomEvent('codeflow-save-file'));
        return;
      }

      // F5 para ejecutar código
      if (event.key === 'F5' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atajo: F5 - Ejecutar código');
        window.dispatchEvent(new CustomEvent('codeflow-execute'));
        return;
      }

      // F6 para transcribir voz
      if (event.key === 'F6' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atajo: F6 - Transcribir voz');
        window.dispatchEvent(new CustomEvent('codeflow-transcribe'));
        return;
      }

      // F7 para detener ejecución
      if (event.key === 'F7' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atajo: F7 - Detener ejecución');
        window.dispatchEvent(new CustomEvent('codeflow-stop'));
        return;
      }

      // F8 para cancelar ejecución (abortar WebSocket)
      if (event.key === 'F8' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atajo: F8 - Cancelar ejecución');
        window.dispatchEvent(new CustomEvent('codeflow-cancel'));
        return;
      }

      // Escape para detener/cancelar
      if (event.key === 'Escape' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        // No prevenir default aquí para permitir otros usos de Escape
        console.log('Atajo: Escape - Cancelar operación actual');
        window.dispatchEvent(new CustomEvent('codeflow-cancel'));
        return;
      }
      
      // Alt + número para navegación rápida
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            console.log('Atajo: Alt+1 - Navbar');
            focusComponent('navbar');
            break;
          case '2':
            event.preventDefault();
            event.stopPropagation();
            console.log('Atajo: Alt+2 - FileManager');
            focusComponent('filemanager');
            break;
          case '3':
            event.preventDefault();
            console.log('Atajo: Alt+3 - Editor');
            focusComponent('editor');
            break;
          case '4':
            event.preventDefault();
            console.log('Atajo: Alt+4 - Terminal');
            focusComponent('terminal');
            break;
          case 'a':
          case 'A':
            event.preventDefault();
            console.log('Atajo: Alt+A - Ayuda');
            handleCommand('show-help');
            break;
          case 'e':
          // case 'E':
          //   event.preventDefault();
          //   console.log('Atajo: Alt+E - Ejecutar');
          //   window.dispatchEvent(new CustomEvent('codeflow-execute'));
          //   break;
          // case 't':
          // case 'T':
          //   event.preventDefault();
          //   console.log('Atajo: Alt+T - Transcribir');
          //   window.dispatchEvent(new CustomEvent('codeflow-transcribe'));
          //   break;
          default:
            break;
        }
      }

      // Ctrl + Alt para acciones específicas
      if (event.ctrlKey && event.altKey && !event.shiftKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            console.log(' Atajo: Ctrl+Alt+N - Crear archivo');
            handleCommand('filemanager-create-file');
            break;
          case 'f':
            event.preventDefault();
            console.log(' Atajo: Ctrl+Alt+F - Crear carpeta');
            handleCommand('filemanager-create-folder');
            break;
          case 'o':
            event.preventDefault();
            console.log(' Atajo: Ctrl+Alt+O - Abrir archivo');
            handleCommand('filemanager-open-file');
            break;
          case 'e':
            event.preventDefault();
            console.log(' Atajo: Ctrl+Alt+E - Ejecutar código');
            window.dispatchEvent(new CustomEvent('codeflow-execute'));
            break;
          case 'x':
            event.preventDefault();
            console.log(' Atajo: Ctrl+Alt+X - Cancelar ejecución');
            window.dispatchEvent(new CustomEvent('codeflow-cancel'));
            break;
          default:
            break;
        }
      }

      // F-keys para funciones especiales
      if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
        switch (event.key) {
          case 'F1':
            event.preventDefault();
            console.log(' Atajo: F1 - Ayuda');
            handleCommand('show-help');
            break;
          case 'F2':
            event.preventDefault();
            console.log(' Atajo: F2 - Toggle Screen Reader');
            window.dispatchEvent(new CustomEvent('codeflow-toggle-screenreader'));
            break;
          case 'F3':
            event.preventDefault();
            console.log(' Atajo: F3 - Toggle Contraste');
            window.dispatchEvent(new CustomEvent('codeflow-toggle-contrast'));
            break;
          default:
            break;
        }
      }
    };

    // Usar capture phase para interceptar antes que otros handlers
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [focusComponent, handleCommand]);

  const value = {
    focusedComponent,
    setFocusedComponent,
    registerComponent,
    unregisterComponent,
    focusComponent,
    listeningForCommands,
    setListeningForCommands,
    voiceCommands
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};