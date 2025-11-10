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

    // Detener cualquier anuncio anterior
    if (window.speechSynthesis.speaking || speakingChunksRef.current) {
      window.speechSynthesis.cancel();
      speakingChunksRef.current = false;
    }

    const ensureSpeechSynthesisReady = (callback) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        callback();
        return;
      }
      
      let voicesLoaded = false;
      const voicesChangedHandler = () => {
        if (!voicesLoaded && window.speechSynthesis.getVoices().length > 0) {
          voicesLoaded = true;
          window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
          callback();
        }
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
      
      // Timeout de seguridad aumentado para Chrome
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
        if (!voicesLoaded) {
          console.warn('⚠️ Timeout esperando voces, intentando continuar...');
          callback();
        }
      }, 2000); // Aumentado de 1000 a 2000ms
    };

    ensureSpeechSynthesisReady(() => {
      // Limpiar el texto para lectura natural
      let cleanText = text.trim();
      
      cleanText = cleanText.replace(/```[\s\S]*?```/g, ' bloque de código ');
      cleanText = cleanText.replace(/`([^`]+)`/g, ' código $1 ');
      cleanText = cleanText.replace(/\*\*([^*]+)\*\*/g, '$1');
      cleanText = cleanText.replace(/\*([^*]+)\*/g, '$1');
      cleanText = cleanText.replace(/#{1,6}\s/g, '');
      cleanText = cleanText.replace(/\n{2,}/g, '. ');
      cleanText = cleanText.replace(/\n/g, ' ');
      cleanText = cleanText.replace(/[_~]/g, '');
      cleanText = cleanText.replace(/\s+/g, ' ').trim();
      
      const maxLength = 200;
      const chunks = [];
      
      if (cleanText.length > maxLength) {
        const sentenceRegex = /[^.!?]+[.!?]+(?:\s|$)/g;
        const sentences = cleanText.match(sentenceRegex) || [];
        
        if (sentences.length === 0) {
          let remaining = cleanText;
          while (remaining.length > 0) {
            if (remaining.length <= maxLength) {
              chunks.push(remaining.trim());
              break;
            }
            
            let splitPoint = remaining.lastIndexOf(' ', maxLength);
            if (splitPoint === -1) splitPoint = maxLength;
            
            chunks.push(remaining.substring(0, splitPoint).trim());
            remaining = remaining.substring(splitPoint).trim();
          }
        } else {
          let currentChunk = '';
          
          sentences.forEach(sentence => {
            const trimmedSentence = sentence.trim();
            if ((currentChunk + ' ' + trimmedSentence).length > maxLength && currentChunk.length > 0) {
              chunks.push(currentChunk.trim());
              currentChunk = trimmedSentence;
            } else {
              currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
            }
          });
          
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
          }
        }
      } else {
        chunks.push(cleanText);
      }

      if (chunks.length === 0 || chunks.every(c => !c.trim())) {
        console.warn('No hay contenido válido para leer');
        return;
      }

      speakingChunksRef.current = true;

      const speakNextChunk = (index = 0) => {
        if (index >= chunks.length || !speakingChunksRef.current) {
          setIsSpeaking(false);
          speakingChunksRef.current = false;
          currentUtteranceRef.current = null;
          return;
        }

        if (!window.speechSynthesis) {
          console.error('Speech synthesis no disponible');
          setIsSpeaking(false);
          speakingChunksRef.current = false;
          return;
        }

        const chunkText = chunks[index].trim();
        if (!chunkText) {
          setTimeout(() => speakNextChunk(index + 1), 100);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunkText);
        utterance.lang = options.lang || 'es-ES';
        utterance.rate = options.rate || 1.2;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;

        if (index === 0) {
          utterance.onstart = () => {
            setIsSpeaking(true);
          };
        }

        utterance.onend = () => {
          const pauseDuration = Math.min(300, chunkText.length * 1.5);
          setTimeout(() => {
            if (speakingChunksRef.current) {
              speakNextChunk(index + 1);
            }
          }, pauseDuration);
        };

        utterance.onerror = (e) => {
          console.error('Error en síntesis de voz:', e);
          
          // NUEVO: Manejo específico para 'not-allowed' en Chrome
          if (e.error === 'not-allowed') {
            console.error('❌ Chrome bloqueó speechSynthesis - auto-focus no es interacción válida');
            console.log('💡 Solución: El usuario debe hacer clic o presionar una tecla primero');
            speakingChunksRef.current = false;
            setIsSpeaking(false);
            return;
          }
          
          if (e.error === 'interrupted' || e.error === 'canceled') {
            speakingChunksRef.current = false;
            setIsSpeaking(false);
            return;
          }
          
          if (e.error === 'network' || e.error === 'synthesis-failed') {
            console.warn(`Reintentando chunk ${index} después de error: ${e.error}`);
            setTimeout(() => {
              if (speakingChunksRef.current) {
                speakNextChunk(index);
              }
            }, 500);
          } else {
            console.error(`Error no recuperable en chunk ${index}:`, e);
            setIsSpeaking(false);
            speakingChunksRef.current = false;
            currentUtteranceRef.current = null;
          }
        };

        currentUtteranceRef.current = utterance;
        
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        
        try {
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Error al ejecutar speech synthesis:', error);
          setIsSpeaking(false);
          speakingChunksRef.current = false;
        }
      };

      speakNextChunk(0);
    });
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