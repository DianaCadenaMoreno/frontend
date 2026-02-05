import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useInteractionMode } from './InteractionModeContext';

const ScreenReaderContext = createContext();

export const useScreenReader = () => {
  const context = useContext(ScreenReaderContext);
  if (!context) {
    throw new Error('useScreenReader debe usarse dentro de ScreenReaderProvider');
  }
  return context;
};

export const ScreenReaderProvider = ({ children }) => {
  const [enabled, setEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [focusedElement, setFocusedElement] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const lastSpokenRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const speakingChunksRef = useRef(false);

  // Usar el hook directamente (ahora que InteractionModeProvider está antes en App.js)
  const { isKeyboardMode, isMouseMode } = useInteractionMode();

  // Función mejorada para anunciar mensajes con mejor manejo de textos largos
  const speak = useCallback((text, options = {}) => {
    if (!enabled || !text) return;

    if (options.interrupt !== false && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    let cleanText = text.trim()
      .replace(/```[\s\S]*?```/g, ' bloque de código ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // SOLUCIÓN 1: Reducir el límite para evitar timeouts del navegador
    const MAX_UTTERANCE_LENGTH = 1000; // Reducido drásticamente
    
    if (cleanText.length <= MAX_UTTERANCE_LENGTH) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = options.lang || 'es-ES';
      utterance.rate = options.rate || 1.1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.warn('Error en síntesis:', e.error);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // SOLUCIÓN 2: Dividir por oraciones más pequeñas
      const sentences = cleanText.split(/[.!?]+\s+/).filter(s => s.trim());
      let currentIndex = 0;

      const speakNext = () => {
        if (currentIndex >= sentences.length) {
          setIsSpeaking(false);
          return;
        }

        // SOLUCIÓN 3: Verificar si la síntesis sigue activa antes de continuar
        if (!enabled) {
          setIsSpeaking(false);
          return;
        }

        const sentence = sentences[currentIndex].trim() + '.';
        
        // SOLUCIÓN 4: Límite más conservador por oración
        if (sentence.length > 200) {
          // Si una oración es muy larga, dividirla por comas
          const parts = sentence.split(',').filter(p => p.trim());
          // Procesar cada parte como una oración separada
          sentences.splice(currentIndex, 1, ...parts.map(p => p.trim()));
          speakNext(); // Reintentar con la oración dividida
          return;
        }

        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = options.lang || 'es-ES';
        utterance.rate = options.rate || 1.1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;

        if (currentIndex === 0) {
          utterance.onstart = () => setIsSpeaking(true);
        }

        utterance.onend = () => {
          currentIndex++;
          // SOLUCIÓN 5: Pausa más larga entre oraciones para evitar acumulación
          setTimeout(speakNext, 300);
        };

        utterance.onerror = (e) => {
          console.warn('Error en oración:', e.error, 'Oración:', sentence);
          currentIndex++;
          setTimeout(speakNext, 500);
        };

        // SOLUCIÓN 6: Verificar que speechSynthesis esté listo
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);
      };

      speakNext();
    }
  }, [enabled]);

  // Función para leer al pasar el mouse (con delay)
  const speakOnHover = useCallback((text, delay = 500) => {
    if (!enabled || !text || isKeyboardMode) {
      return;
    }

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (lastSpokenRef.current === text) {
      return;
    }

    hoverTimeoutRef.current = setTimeout(() => {
      if (!isKeyboardMode) {
        speak(text, { rate: 1.3 });
        lastSpokenRef.current = text;
        
        setTimeout(() => {
          lastSpokenRef.current = null;
        }, 2000);
      }
    }, delay);
  }, [enabled, speak, isKeyboardMode]);

  // Función para leer al hacer focus (sin delay)
  const speakOnFocus = useCallback((text) => {
    if (!enabled || !text) return;
    
    if (!isKeyboardMode && isMouseMode) {
      return;
    }
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    speak(text, { rate: 1.3 });
    lastSpokenRef.current = text;
    setFocusedElement(text);
    
    setTimeout(() => {
      lastSpokenRef.current = null;
    }, 2000);
  }, [enabled, speak, isKeyboardMode, isMouseMode]);

  // Función para cancelar el hover speak
  const cancelHoverSpeak = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  // Función para anunciar a lectores de pantalla (sin voz)
  const announce = useCallback((message) => {
    if (!enabled) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [enabled]);

  // Función para detener el habla
  const stop = useCallback(() => {
    cancelHoverSpeak();
    speakingChunksRef.current = false;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
  }, [cancelHoverSpeak]);

  // Toggle del lector
  const toggle = useCallback(() => {
    setEnabled(prev => {
      const newValue = !prev;
      if (newValue) {
        speak('Lector de pantalla y notificaciones de voz activados');
      } else {
        announce('Lector de pantalla y notificaciones de voz desactivados');
        stop();
      }
      return newValue;
    });
  }, [speak, announce, stop]);

  // Watchdog simplificado
  useEffect(() => {
    if (!enabled) return;

    const watchdog = setInterval(() => {
      if (isSpeaking && !window.speechSynthesis.speaking && !window.speechSynthesis.pending && !speakingChunksRef.current) {
        console.warn('Speech synthesis en estado inconsistente, limpiando...');
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      }
    }, 2000);

    return () => clearInterval(watchdog);
  }, [isSpeaking, enabled]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      cancelHoverSpeak();
      speakingChunksRef.current = false;
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [cancelHoverSpeak]);

  const value = {
    enabled,
    setEnabled,
    isSpeaking,
    focusedElement,
    speak,
    speakOnHover,
    speakOnFocus,
    cancelHoverSpeak,
    announce,
    stop,
    toggle
  };

  return (
    <ScreenReaderContext.Provider value={value}>
      {children}
    </ScreenReaderContext.Provider>
  );
};