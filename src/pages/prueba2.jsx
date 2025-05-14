import React, { useState, useRef, useEffect } from 'react';

const Magnifier = ({
  zoomFactor = 2,      // Factor de ampliación (por defecto 2x)
  lensSize = 200,      // Diámetro del lente en píxeles (por defecto 200px)
  magnifierEnabled,    // Booleano que indica si el modo lupa está activo
  children
}) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const lensContentRef = useRef(null);
  const [containerRect, setContainerRect] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Actualiza las dimensiones del contenedor al montar el componente o al redimensionar la ventana.
  useEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        setContainerRect(containerRef.current.getBoundingClientRect());
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  // Actualiza la posición del cursor y clona el contenido para la lupa.
  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (lensContentRef.current && contentRef.current) {
      // Clona el nodo del contenido ya renderizado.
      const clone = contentRef.current.cloneNode(true);
      // Limpia el contenido previo y agrega el clon.
      lensContentRef.current.innerHTML = "";
      lensContentRef.current.appendChild(clone);
    }
  };

  // Calcula la posición relativa del cursor dentro del contenedor.
  let relativeX = 0, relativeY = 0;
  if (containerRect) {
    relativeX = mousePos.x - containerRect.left;
    relativeY = mousePos.y - containerRect.top;
  }

  // Offset para centrar el área ampliada en el lente.
  const offsetX = lensSize / 2 - relativeX * zoomFactor;
  const offsetY = lensSize / 2 - relativeY * zoomFactor;

  return (
    <div 
      ref={containerRef} 
      style={{ position: 'relative', height: '100vh' }} 
      onMouseMove={magnifierEnabled ? handleMouseMove : undefined}
      aria-label="Contenido con modo lupa"
    >
      {/* Renderizado único del contenido */}
      <div ref={contentRef} style={{ height: '100vh' }}>
        {children}
      </div>
      {/* Lente que muestra el contenido clonado */}
      {magnifierEnabled && containerRect && (
        <div
          style={{
            position: 'fixed',
            top: mousePos.y - lensSize / 2,
            left: mousePos.x - lensSize / 2,
            width: lensSize,
            height: lensSize,
            borderRadius: '50%',
            border: '2px solid #ccc',
            overflow: 'hidden',
            pointerEvents: 'none', // Permite interacciones sobre el contenido original
            zIndex: 9999,
            background: 'white'
          }}
        >
          <div
            ref={lensContentRef}
            style={{
              position: 'absolute',
              top: offsetY,
              left: offsetX,
              transform: `scale(${zoomFactor})`,
              transformOrigin: 'top left',
              width: containerRect.width,
              height: containerRect.height
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Magnifier;