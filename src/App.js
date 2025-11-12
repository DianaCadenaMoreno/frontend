import React from 'react';
import './App.css';
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import IDE from './pages/IDE';
import PRUEBA from './pages/prueba';
import { ScreenReaderProvider } from './contexts/ScreenReaderContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { InteractionModeProvider } from './contexts/InteractionModeContext';

function App() {
  return ( 
    <div className="App">
      <InteractionModeProvider>
        <ScreenReaderProvider>
          <NavigationProvider>
            <Router>
              <Routes>
                <Route path="/prueba" element={<PRUEBA />}/>
                <Route path="/" element={<IDE />} />
              </Routes>
            </Router>
          </NavigationProvider>
        </ScreenReaderProvider>
      </InteractionModeProvider>
    </div>
  );
}

export default App;