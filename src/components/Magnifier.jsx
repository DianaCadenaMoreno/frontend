import React, { useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';

function Magnifier({ enabled, scale }) {
  const magnifierRef = useRef(null);

  useEffect(() => {
    if (enabled) {
      html2canvas(document.body).then(canvas => {
        const dataURL = canvas.toDataURL();
        magnifierRef.current.style.backgroundImage = `url(${dataURL})`;
      });
    }
  }, [enabled, scale]);

  const handleMouseMove = (e) => {
    if (!enabled) return;

    const magnifier = magnifierRef.current;
    const { clientX: x, clientY: y } = e;

    // Mueve la lupa con el cursor
    magnifier.style.left = `${x - magnifier.offsetWidth / 2}px`;
    magnifier.style.top = `${y - magnifier.offsetHeight / 2}px`;

    // Ajusta el zoom centrado en el cursor
    magnifier.style.backgroundPosition = `-${x * scale - magnifier.offsetWidth / 2}px -${y * scale - magnifier.offsetHeight / 2}px`;
  };

  return (
    <div
      ref={magnifierRef}
      onMouseMove={handleMouseMove}
      style={{
        position: 'absolute',
        pointerEvents: enabled ? 'auto' : 'none',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        border: '2px solid #000',
        overflow: 'hidden',
        display: enabled ? 'block' : 'none',
        zIndex: 1000,
        backgroundColor: 'red', // Color de fondo rojo para verificar que se muestra
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${document.body.clientWidth * scale}px ${document.body.clientHeight * scale}px`, // Escalar el fondo
      }}
    />
  );
}

export default Magnifier;