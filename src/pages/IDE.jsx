import React, { useEffect, useRef, useState } from 'react';
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
  const [cursorSize, setCursorSize] = React.useState(24);
  const [fontSize, setFontSize] = React.useState(14);
  const [magnifierSize, setMagnifierSize] = React.useState(200);
  const [magnifierZoom, setMagnifierZoom] = React.useState(2);
  const [output, setOutput] = React.useState([]);
  const [codeStructure, setCodeStructure] = React.useState([]);
  const [editorContent, setEditorContent] = React.useState('');
  const [fileManagerCollapsed, setFileManagerCollapsed] = useState(false);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);

  const navbarRef = useRef(null);
  const fileManagerRef = useRef(null);
  const textEditorRef = useRef(null);
  const terminalTabsRef = useRef(null);
  const [pid, setPid] = React.useState(null);

  const handleOpenAppearanceModal = () => setIsAppearanceModalOpen(true);
  const handleCloseAppearanceModal = () => setIsAppearanceModalOpen(false);

  const handleFileOpen = (fileName, content) => {
    setEditorContent(content || '');
  };

  // Aplicar estilos globales cuando cambien las configuraciones
  useEffect(() => {
    // Aplicar tamaño de cursor
    const cursorStyle = `
      * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><path fill="black" d="M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.45,2.08 7.62,2.22L18.73,12.5C19.1,12.81 19.13,13.39 18.82,13.76C18.73,13.85 18.63,13.92 18.53,13.97L15.45,15.8L17.64,20.5C17.87,21 17.66,21.6 17.16,21.83L13.64,21.97Z"/></svg>') ${cursorSize/2} ${cursorSize/2}, auto !important;
      }
      
      button, a, input, select, textarea, [role="button"], .MuiButton-root, .MuiIconButton-root {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><path fill="blue" d="M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.45,2.08 7.62,2.22L18.73,12.5C19.1,12.81 19.13,13.39 18.82,13.76C18.73,13.85 18.63,13.92 18.53,13.97L15.45,15.8L17.64,20.5C17.87,21 17.66,21.6 17.16,21.83L13.64,21.97Z"/></svg>') ${cursorSize/2} ${cursorSize/2}, pointer !important;
      }
    `;

    // Aplicar tamaño de fuente
    const fontStyle = `
      .MuiTypography-root, .MuiButton-root, .MuiTab-root, .MuiMenuItem-root, .MuiTextField-root input, .MuiTextField-root textarea {
        font-size: ${fontSize}px !important;
      }
    `;

    // Crear o actualizar el style element
    let styleElement = document.getElementById('custom-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-styles';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = cursorStyle + fontStyle;

    return () => {
      // Cleanup si es necesario
    };
  }, [cursorSize, fontSize]);

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
      recognition.lang = 'es-ES';

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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      width: '100vw',
      overflow: 'hidden'
    }}>
      <Magnifier zoomFactor={magnifierZoom} lensSize={magnifierSize} magnifierEnabled={magnifierEnabled}>
        <Zoom contrast={contrast} setContrast={setContrast} scale={scale} setScale={setScale} magnifierEnabled={magnifierEnabled}>
          {/* Navbar fijo */}
          <div style={{ flexShrink: 0, zIndex: 1000 }}>
            <Navbar 
              ref={navbarRef} 
              onOpenAppearanceModal={handleOpenAppearanceModal}
              role="banner"
              aria-label="Barra de navegación principal"
            />
          </div>
          
          {/* Contenido principal con Split */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            minHeight: 0,
            overflow: 'hidden'
          }}>
            <Split 
              direction="horizontal" 
              sizes={fileManagerCollapsed ? [5, 95] : [25, 75]}
              minSize={fileManagerCollapsed ? 50 : 200}
              maxSize={fileManagerCollapsed ? 50 : 400}
              style={{ 
                display: 'flex', 
                height: '100%',
                width: '100%'
              }}
              className="split-horizontal"
              aria-label="División horizontal entre gestor de archivos y editor"
            >
              {/* File Manager */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden'
              }}>
                <FileManager 
                  ref={fileManagerRef} 
                  contrast={contrast} 
                  codeStructure={codeStructure} 
                  onFileOpen={handleFileOpen}
                  collapsed={fileManagerCollapsed}
                  onToggleCollapse={() => setFileManagerCollapsed(!fileManagerCollapsed)}
                  role="complementary"
                  aria-label="Gestor de archivos y chat"
                />
              </div>

              {/* Editor y Terminal */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
                flex: 1
              }}>
                <Split 
                  direction="vertical" 
                  sizes={terminalCollapsed ? [95, 5] : [60, 40]}
                  minSize={terminalCollapsed ? 50 : 150}
                  maxSize={terminalCollapsed ? 50 : undefined}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: 0
                  }}
                  className="split-vertical"
                  aria-label="División vertical entre editor y terminal"
                  resizerStyle={{
                    background: '#ddd',
                    cursor: 'row-resize'
                  }}
                  split="horizontal"
                >
                  {/* Text Editor */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden'
                  }}>
                    <TextEditor 
                      ref={textEditorRef} 
                      contrast={contrast} 
                      scale={scale} 
                      setOutput={setOutput} 
                      setCodeStructure={setCodeStructure} 
                      editorContent={editorContent} 
                      setEditorContent={setEditorContent} 
                      setPid={setPid}
                      role="main"
                      aria-label="Editor de código principal"
                    />
                  </div>

                  {/* Terminal */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden'
                  }}>
                    <TerminalTabs 
                      ref={terminalTabsRef} 
                      contrast={contrast} 
                      scale={scale} 
                      output={output} 
                      pid={pid} 
                      onDebug={0} 
                      textEditorRef={textEditorRef}
                      collapsed={terminalCollapsed}
                      onToggleCollapse={() => setTerminalCollapsed(!terminalCollapsed)}
                      role="complementary"
                      aria-label="Terminal y herramientas de depuración"
                    />
                  </div>
                </Split>
              </div>
            </Split>
          </div>
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
        cursorSize={cursorSize}
        setCursorSize={setCursorSize}
        fontSize={fontSize}
        setFontSize={setFontSize}
        magnifierSize={magnifierSize}
        setMagnifierSize={setMagnifierSize}
        magnifierZoom={magnifierZoom}
        setMagnifierZoom={setMagnifierZoom}
      />
    </div>
  );
}

export default IDE;