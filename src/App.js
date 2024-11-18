// import logo from './logo.svg';
import React from 'react';
import './App.css';
import { Route, BrowserRouter as Router, Routes, } from "react-router-dom";
import IDE from './pages/IDE';
import PRUEBA from './pages/prueba';

function useScreenReader() {
  React.useEffect(() => {
    const handleFocus = (event) => {
      const element = event.target;
      const text = element instanceof HTMLElement ? (element.getAttribute('aria-label') || element.textContent) : '';
      if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
      }
    };

    window.addEventListener('focus', handleFocus, true);

    return () => {
      window.removeEventListener('focus', handleFocus, true);
    };
  }, []);
}

function App() {
  useScreenReader();

  return ( 
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
  );
}

export default App;
