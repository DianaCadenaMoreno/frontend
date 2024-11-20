// import logo from './logo.svg';
import React from 'react';
import './App.css';
import { Route, BrowserRouter as Router, Routes, } from "react-router-dom";
import IDE from './pages/IDE';
import PRUEBA from './pages/prueba';

function useScreenReader() {
  React.useEffect(() => {
    let lastFocusedElement = null;
    let debounceTimeout = null;

    const handleFocus = (event) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const element = event.target;
        if (element === lastFocusedElement) return; // Evitar manejar el mismo elemento dos veces
        lastFocusedElement = element;
        const text = element instanceof HTMLElement ? (element.getAttribute('aria-label') || element.textContent) : '';
        if (text && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'es-ES';
          utterance.rate = 1.2;
          utterance.onerror = (e) => console.error('Speech synthesis error:', e);
          window.speechSynthesis.speak(utterance);
        }
      }, 100); // tiempo de debounce 
    };

    if (window.speechSynthesis) {
      window.addEventListener('focus', handleFocus, true);
    } else {
      console.error('Speech synthesis not supported in this browser.');
    }

    return () => {
      if (window.speechSynthesis) {
        window.removeEventListener('focus', handleFocus, true);
      }
    };
  }, []);
}

function App() {
  useScreenReader();
  return ( 
    <div className = "App" >
    <Router>
      <Routes>
        <Route
          path="/prueba"
          element={<PRUEBA />}/>
        <Route
          path="/"
          element={<IDE />}
        />
      </Routes>
    </Router>
    </div>
  );
}

export default App;
