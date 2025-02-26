import React, { useEffect, useRef } from 'react';
import Split from 'react-split';
import { Box } from '@mui/material';
import Navbar from '../components/Navbar';
import FileManager from '../components/FileManager';
import TextEditor from '../components/TextEditor';
import TerminalTabs from '../components/TerminalTabs';
import '../styles/split.css';
import Zoom from '../components/Zoom';
import AppearanceModal from '../components/AppearanceModal';
import Magnifier from '../pages/prueba2';

function IDE() {
  const [contrast, setContrast] = React.useState('normal');
  const [scale, setScale] = React.useState(1);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = React.useState(false);
  const [magnifierEnabled, setMagnifierEnabled] = React.useState(false);
  const [output, setOutput] = React.useState(null);
  const [codeStructure, setCodeStructure] = React.useState([]);
  const [editorContent, setEditorContent] = React.useState('');

  const navbarRef = useRef(null);
  const fileManagerRef = useRef(null);
  const textEditorRef = useRef(null);
  const terminalTabsRef = useRef(null);

  const handleOpenAppearanceModal = () => setIsAppearanceModalOpen(true);
  const handleCloseAppearanceModal = () => setIsAppearanceModalOpen(false);

  const handleFileOpen = (fileName) => {
    setEditorContent(`Contenido del archivo: ${fileName}`);
  };

  const handleKeyDown = (event) => {
    if (event.altKey) {
      switch (event.key) {
        case '1':
          console.log('Focus navbar');
          if (navbarRef.current) {
            console.log('Navbar ref', navbarRef.current);
            navbarRef.current.openArchivosMenu(event);
          }
          break;
        case '2':
          if (fileManagerRef.current) {
            fileManagerRef.current.focus();
          }
          break;
        case '3':
          if (textEditorRef.current) {
            console.log('Text editor ref', textEditorRef.current);
            textEditorRef.current.focusEditor();
          }
          break;
        case '4':
          if (terminalTabsRef.current) {
            terminalTabsRef.current.focus();
          }
          break;
        default:
          break;
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    // <Magnifier active={magnifierEnabled} magnification={2} lensDiameter={200}>
    
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Magnifier zoomFactor={2} lensSize={200} magnifierEnabled={magnifierEnabled}>
      <Zoom contrast={contrast} setContrast={setContrast} scale={scale} setScale={setScale} magnifierEnabled={magnifierEnabled}>
        <Navbar ref={navbarRef} onOpenAppearanceModal={handleOpenAppearanceModal} />
        <Split direction="horizontal" style={{ flex: 1, display: 'flex', height: '100%' }}>
          <FileManager ref={fileManagerRef} contrast={contrast} codeStructure={codeStructure} onFileOpen={handleFileOpen} />
          <Split direction="vertical" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TextEditor ref={textEditorRef} contrast={contrast} scale={scale} setOutput={setOutput} setCodeStructure={setCodeStructure} editorContent={editorContent} setEditorContent={setEditorContent} />
            <TerminalTabs ref={terminalTabsRef} contrast={contrast} scale={scale} output={output} />
          </Split>
        </Split>
      </Zoom>
      </Magnifier>
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