import React, { useState, useEffect } from 'react';

function Magnifier() {
  // Estados para manejar la posición del mouse y la visibilidad de la lupa
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [isMagnifierVisible, setIsMagnifierVisible] = useState(false);

  // Función para actualizar la posición del mouse
  const handleMouseMove = (e) => {
    setMagnifierPosition({ x: e.clientX, y: e.clientY });
  };

  // Mostrar la lupa solo cuando se mueve el mouse
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Mostrar y ocultar la lupa cuando el mouse entra o sale de la ventana
  useEffect(() => {
    const handleMouseEnter = () => setIsMagnifierVisible(true);
    const handleMouseLeave = () => setIsMagnifierVisible(false);

    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Contenido normal de la página */}
      <h1>Página con lupa</h1>
      <p>
        Mueve el mouse sobre esta página para ver el efecto de la lupa.
      </p>

      {/* Lupa */}
      {isMagnifierVisible && (
        <div
          style={{
            position: 'absolute',
            top: magnifierPosition.y - 100, // Ajusta el tamaño de la lupa
            left: magnifierPosition.x - 100,
            width: '200px', // Tamaño de la lupa
            height: '200px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.3)', // Fondo translúcido
            border: '2px solid rgba(0, 0, 0, 0.2)', // Borde
            overflow: 'hidden',
            zIndex: 1000,
            pointerEvents: 'none',
            backgroundImage: `url('https://via.placeholder.com/1200')`, // Imagen para la lupa
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `-${magnifierPosition.x * 2 - 100}px -${magnifierPosition.y * 2 - 100}px`, // Mover la imagen al revés para hacer zoom
            backgroundSize: '200%', // Doble tamaño para efecto de zoom
          }}
        ></div>
      )}
    </div>
  );
}

export default Magnifier;
