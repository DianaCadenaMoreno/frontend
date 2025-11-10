import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const InteractionModeContext = createContext();

export const useInteractionMode = () => {
  const context = useContext(InteractionModeContext);
  if (!context) {
    throw new Error('useInteractionMode debe usarse dentro de InteractionModeProvider');
  }
  return context;
};

export const InteractionModeProvider = ({ children }) => {
  const [mode, setMode] = useState('keyboard'); // 'mouse' o 'keyboard'
  const [isKeyboardActive, setIsKeyboardActive] = useState(true);
  const keyboardTimeoutRef = useRef(null);
  //const lastKeyTimeRef = useRef(0);
  const lastKeyTimeRef = useRef(Date.now());

  // Detectar uso del teclado
  const handleKeyDown = useCallback((event) => {
    // Solo considerar teclas de navegación
    const navigationKeys = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Tab', 'Enter', ' ', 'Escape', 'Home', 'End', 'PageUp', 'PageDown'
    ];
    
    // O combinaciones con Alt, Ctrl
    const isNavigationKey = navigationKeys.includes(event.key) || 
                           event.altKey || 
                           event.ctrlKey || 
                           event.metaKey;

    if (isNavigationKey) {
      const now = Date.now();
      lastKeyTimeRef.current = now;
      
      if (mode !== 'keyboard') {
        console.log(' Modo cambiado a: TECLADO');
        setMode('keyboard');
      }
      
      setIsKeyboardActive(true);

      // Limpiar timeout anterior
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }

      // Mantener modo teclado por 2 segundos después de la última tecla
      keyboardTimeoutRef.current = setTimeout(() => {
        setIsKeyboardActive(false);
      }, 2000);
    }
  }, [mode]);

  // Detectar uso del mouse
  const handleMouseMove = useCallback((event) => {
    // Solo cambiar a mouse si:
    // 1. El modo actual no es teclado
    // 2. O han pasado más de 2 segundos desde la última tecla
    const timeSinceLastKey = Date.now() - lastKeyTimeRef.current;
    
    if (!isKeyboardActive && timeSinceLastKey > 2000 && mode !== 'mouse') {
      console.log(' Modo cambiado a: MOUSE');
      setMode('mouse');
    }
  }, [mode, isKeyboardActive]);

  const handleMouseDown = useCallback(() => {
    // Solo cambiar si han pasado más de 500ms desde la última tecla
    const timeSinceLastKey = Date.now() - lastKeyTimeRef.current;
    
    if (timeSinceLastKey > 500) {
      if (isKeyboardActive) {
        setIsKeyboardActive(false);
      }
      if (mode !== 'mouse') {
        console.log(' Modo cambiado a: MOUSE (click)');
        setMode('mouse');
      }
    }
  }, [mode, isKeyboardActive]);

  // Agregar listeners globales
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mousedown', handleMouseDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mousedown', handleMouseDown, true);
      
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }
    };
  }, [handleKeyDown, handleMouseMove, handleMouseDown]);

  const value = {
    mode,
    isKeyboardActive,
    isMouseMode: mode === 'mouse',
    isKeyboardMode: mode === 'keyboard'
  };

  return (
    <InteractionModeContext.Provider value={value}>
      {children}
    </InteractionModeContext.Provider>
  );
};