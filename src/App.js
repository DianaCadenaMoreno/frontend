// import logo from './logo.svg';
import './App.css';
import { Route, BrowserRouter as Router, Routes, } from "react-router-dom";
import IDE from './pages/IDE';
import PRUEBA from './pages/prueba';

function App() {
  return (
    <div className="App">  
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
