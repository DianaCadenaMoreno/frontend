import React from 'react';
import Split from 'react-split';
import { Box } from '@mui/material';
import Navbar from '../components/Navbar';
import FileManager from '../components/FileManager';
import TextEditor from '../components/TextEditor';
import TerminalTabs from '../components/TerminalTabs';
import '../styles/split.css';
import Zoom from '../components/Zoom';
import AppearanceModal from '../components/AppearanceModal';

function IDE() {
  const [contrast, setContrast] = React.useState('normal');
  const [scale, setScale] = React.useState(1);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = React.useState(false);
  const [magnifierEnabled, setMagnifierEnabled] = React.useState(false);
  const [output, setOutput] = React.useState(null); // Añadir estado output
  const [codeStructure, setCodeStructure] = React.useState([]);
  const [editorContent, setEditorContent] = React.useState('');
  
  const handleOpenAppearanceModal = () => setIsAppearanceModalOpen(true);
  const handleCloseAppearanceModal = () => setIsAppearanceModalOpen(false);

  // Lógica para mostrar la lupa fuera del modal
  const [magnifierPosition, setMagnifierPosition] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (event) => {
    if (magnifierEnabled) {
      setMagnifierPosition({ x: event.clientX, y: event.clientY });
    }
  };

  React.useEffect(() => {
    if (magnifierEnabled) {
      window.addEventListener('mousemove', handleMouseMove);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [magnifierEnabled]);

  const handleFileOpen = (fileName) => {
    // Aquí puedes agregar la lógica para cargar el contenido del archivo
    // Por ahora, simplemente estableceremos el nombre del archivo como contenido del editor
    setEditorContent(`Contenido del archivo: ${fileName}`);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Lupa */}
      {magnifierEnabled && (
        <div
          style={{
            position: 'absolute',
            top: magnifierPosition.y - 150,
            left: magnifierPosition.x - 150,
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            zIndex: 1000,
            border: '2px solid rgba(255, 0, 0, 0.5)',
            //clipPath: 'circle(150px at center)',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: `calc(-${magnifierPosition.y}px + 150px)`,
              left: `calc(-${magnifierPosition.x}px + 150px)`,
              width: '100vw', // Ocupa todo el ancho de la ventana
              height: '100vh', // Ocupa todo el alto de la ventana
              transform: `scale(${scale * 2})`,
              transformOrigin: `${magnifierPosition.x}px ${magnifierPosition.y}px`,
            }}
          >
            {/* contenido principal con escalado lo que este dentro de la lupa sin escalado lo que esta por fuera todo es visible */}
              <Zoom contrast={contrast} setContrast={setContrast} scale={scale} setScale={setScale} magnifierEnabled={magnifierEnabled}>
                <Navbar onOpenAppearanceModal={handleOpenAppearanceModal} />
                <Split direction="horizontal" style={{ flex: 1, display: 'flex' }}>
                  <FileManager contrast={contrast} codeStructure={codeStructure}/> {/*verificar que se pasen en el otro estado*/}
                  <Split direction="vertical" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}> {/*verificar que se pasen en el otro estado*/}
                    <TextEditor contrast={contrast} scale={scale} />
                    <TerminalTabs contrast={contrast} scale={scale} />
                  </Split>
                </Split>
              </Zoom>
          </div>
        </div>
      )}
      <Zoom contrast={contrast} setContrast={setContrast} scale={scale} setScale={setScale} magnifierEnabled={magnifierEnabled}>
        <Navbar onOpenAppearanceModal={handleOpenAppearanceModal} />
          <Split direction="horizontal" style={{ flex: 1, display: 'flex', height: '100%'}}>
            <FileManager contrast={contrast} codeStructure={codeStructure} onFileOpen={handleFileOpen}/>
              <Split direction="vertical" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TextEditor contrast={contrast} scale={scale}  setOutput={setOutput} setCodeStructure={setCodeStructure} editorContent={editorContent} setEditorContent={setEditorContent}/>
                <TerminalTabs contrast={contrast} scale={scale} output={output} />
              </Split>
          </Split>
      </Zoom>
      {/* contenido principal fuera de la condición */}
      {/* {!magnifierEnabled && (
        <Zoom contrast={contrast} setContrast={setContrast} scale={scale} setScale={setScale} magnifierEnabled={magnifierEnabled}>
          <Navbar onOpenAppearanceModal={handleOpenAppearanceModal} />
          <Split direction="horizontal" style={{ flex: 1, display: 'flex' }}>
            <FileManager contrast={contrast} />
            <Split direction="vertical" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TextEditor contrast={contrast} scale={scale} setOutput={setOutput} />
              <TerminalTabs contrast={contrast} scale={scale} output={output} />
            </Split>
          </Split>
        </Zoom>
      )} */}
      <AppearanceModal
        open={isAppearanceModalOpen}
        handleClose={handleCloseAppearanceModal}
        scale={scale}
        setScale={setScale}
        contrast={contrast}
        setContrast={setContrast}
        magnifierEnabled={magnifierEnabled}
        setMagnifierEnabled={setMagnifierEnabled}
      />
    </Box>
  );
}

export default IDE;