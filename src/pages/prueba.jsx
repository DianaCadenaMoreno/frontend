import React, { useState } from 'react';
import Magnifier from './prueba2'; 

const InteractiveDemo = () => {
  const [counter, setCounter] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showDynamic, setShowDynamic] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Demo de Lupa Interactiva</h2>
      <p>
        Activa la lupa (siempre activa en este ejemplo) y prueba a interactuar: 
        haz click en el botón para incrementar el contador, escribe en el input o muestra el componente dinámico.
      </p>
      <Magnifier active={true} magnification={2} lensDiameter={200}>
        <div style={{ padding: '20px', border: '1px solid #ccc' }}>
          {/* Botón para incrementar el contador */}
          <button onClick={() => setCounter(counter + 1)}>
            Click aquí: {counter}
          </button>
          <br /><br />

          {/* Campo de texto interactivo */}
          <input 
            type="text" 
            placeholder="Escribe algo..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ padding: '8px', width: '200px' }}
          />
          <br /><br />

          {/* Botón para mostrar/ocultar un componente dinámico */}
          <button onClick={() => setShowDynamic(!showDynamic)}>
            {showDynamic ? 'Ocultar' : 'Mostrar'} componente dinámico
          </button>
          <br /><br />

          {/* Componente dinámico que muestra un texto actualizable */}
          {showDynamic && <DynamicComponent />}
        </div>
      </Magnifier>
    </div>
  );
};

const DynamicComponent = () => {
  const [text, setText] = useState('Texto inicial');

  return (
    <div style={{ marginTop: '10px', padding: '10px', background: '#e0f7fa' }}>
      <p>{text}</p>
      <button onClick={() => setText('Texto actualizado a las ' + new Date().toLocaleTimeString())}>
        Actualizar Texto
      </button>
    </div>
  );
};

export default InteractiveDemo;
