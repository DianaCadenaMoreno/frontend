import React, { useEffect, useRef } from 'react';
import Split from 'react-split';
import Navbar from '../components/Navbar';
import FileManager from '../components/FileManager';
import TextEditor from '../components/TextEditor';
import TerminalTabs from '../components/TerminalTabs';
import '../styles/split.css';
import Zoom from '../components/Zoom';
import AppearanceModal from '../components/AppearanceModal';
import Magnifier from '../pages/prueba2';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function IDE() {
  const [contrast, setContrast] = React.useState('normal');
  const [scale, setScale] = React.useState(1);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = React.useState(false);
  const [magnifierEnabled, setMagnifierEnabled] = React.useState(false);
  const [output, setOutput] = React.useState([]);
  const [codeStructure, setCodeStructure] = React.useState([]);
  const [editorContent, setEditorContent] = React.useState('');

  const navbarRef = useRef(null);
  const fileManagerRef = useRef(null);
  const textEditorRef = useRef(null);
  const terminalTabsRef = useRef(null);
  const [pid, setPid] = React.useState(null);

  const handleOpenAppearanceModal = () => setIsAppearanceModalOpen(true);
  const handleCloseAppearanceModal = () => setIsAppearanceModalOpen(false);

  const handleFileOpen = (fileName) => {
    setEditorContent(`Contenido del archivo: ${fileName}`);
  };

  const handleKeyDown = (event) => {
    if (event.altKey) {
      switch (event.key) {
        case '1':
          if (navbarRef.current) {
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

  // Speech Recognition setup
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'es-ES'; // Set language to Spanish

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        console.log('Comando de voz detectado:', transcript);

        if (transcript === 'archivos') {
          if (navbarRef.current) {
            navbarRef.current.openArchivosMenu();
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Error en el reconocimiento de voz:', event.error);
      };

      recognition.start();

      return () => {
        recognition.stop();
      };
    } else {
      console.warn('SpeechRecognition no es compatible con este navegador.');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Magnifier zoomFactor={2} lensSize={200} magnifierEnabled={magnifierEnabled}>
        <Zoom contrast={contrast} setContrast={setContrast} scale={scale} setScale={setScale} magnifierEnabled={magnifierEnabled}>
          <Navbar ref={navbarRef} onOpenAppearanceModal={handleOpenAppearanceModal} />
          <Split direction="horizontal" style={{ flex: 1, display: 'flex', minHeight: 0, height: '100vh' }}>
            <FileManager ref={fileManagerRef} contrast={contrast} codeStructure={codeStructure} onFileOpen={handleFileOpen} />
            <Split direction="vertical" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <TextEditor ref={textEditorRef} contrast={contrast} scale={scale} setOutput={setOutput} setCodeStructure={setCodeStructure} editorContent={editorContent} setEditorContent={setEditorContent} setPid={setPid} />
              <TerminalTabs ref={terminalTabsRef} contrast={contrast} scale={scale} output={output} pid={pid} onDebug={0} textEditorRef={textEditorRef}/>
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
    </div>
  );
}

export default IDE;