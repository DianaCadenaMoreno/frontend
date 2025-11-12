import React, { useEffect, useRef, useState } from 'react';
import Split from 'react-split';
import Navbar from '../components/Navbar';
import FileManager from '../components/FileManager';
import TextEditor from '../components/TextEditor';
import TerminalTabs from '../components/TerminalTabs';
import '../styles/split.css';
import Zoom from '../components/Zoom';
import AppearanceModal from '../components/AppearanceModal';
import WelcomeScreen from '../components/Welcome';
import Magnifier from '../pages/prueba2';
import { useInteractionMode } from '../contexts/InteractionModeContext';

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
  const [screenReaderEnabled, setScreenReaderEnabled] = React.useState(true); // Nuevo estado

  const navbarRef = useRef(null);
  const fileManagerRef = useRef(null);
  const textEditorRef = useRef(null);
  const terminalTabsRef = useRef(null);
  const [pid, setPid] = React.useState(null);
  const [hasFiles, setHasFiles] = useState(false);
  const [initialFocusSet, setInitialFocusSet] = useState(false);
  const welcomeRef = useRef(null);
  const { isKeyboardMode, isMouseMode } = useInteractionMode();
  const [currentFileName, setCurrentFileName] = React.useState('');
  const [currentFileId, setCurrentFileId] = React.useState(null);
  const [unsavedChanges, setUnsavedChanges] = React.useState(false);

  const handleOpenAppearanceModal = () => setIsAppearanceModalOpen(true);
  const handleCloseAppearanceModal = () => setIsAppearanceModalOpen(false);

  const handleFileOpen = (fileName, content, fileId) => {
    setEditorContent(content || '');
    setCurrentFileName(fileName);
    setCurrentFileId(fileId);
    setUnsavedChanges(false);
  };

  const handleEditorContentChange = (content) => {
    setEditorContent(content);
    setUnsavedChanges(true);
  };

  const handleSaveFile = React.useCallback(() => {
    if (!currentFileId) {
      console.warn('No hay archivo activo para guardar');
      return;
    }

    const files = JSON.parse(localStorage.getItem('files')) || [];
    const folders = JSON.parse(localStorage.getItem('folders')) || [];

    // Buscar archivo en la lista principal
    let fileIndex = files.findIndex(f => f.id === currentFileId);
    if (fileIndex !== -1) {
      files[fileIndex].content = editorContent;
      files[fileIndex].lastModified = new Date().toISOString();
      localStorage.setItem('files', JSON.stringify(files));
      setUnsavedChanges(false);
      
      // Anunciar guardado
      if (screenReaderEnabled) {
        const utterance = new SpeechSynthesisUtterance(`Archivo ${currentFileName} guardado exitosamente`);
        window.speechSynthesis.speak(utterance);
      }
      return;
    }

    // Buscar en carpetas
    for (let folder of folders) {
      fileIndex = folder.files.findIndex(f => f.id === currentFileId);
      if (fileIndex !== -1) {
        folder.files[fileIndex].content = editorContent;
        folder.files[fileIndex].lastModified = new Date().toISOString();
        localStorage.setItem('folders', JSON.stringify(folders));
        setUnsavedChanges(false);
        
        // Anunciar guardado
        if (screenReaderEnabled) {
          const utterance = new SpeechSynthesisUtterance(`Archivo ${currentFileName} guardado exitosamente`);
          window.speechSynthesis.speak(utterance);
        }
        return;
      }
    }
  }, [currentFileId, editorContent, currentFileName, screenReaderEnabled]);

  // Aplicar estilos globales cuando cambien las configuraciones
  useEffect(() => {
    // Cursor normal: flecha blanca con borde negro
    const normalCursor = `
      * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><defs><filter id="shadow"><feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" flood-color="black"/></filter></defs><path fill="white" stroke="black" stroke-width="1.5" filter="url(%23shadow)" d="M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.45,2.08 7.62,2.22L18.73,12.5C19.1,12.81 19.13,13.39 18.82,13.76C18.73,13.85 18.63,13.92 18.53,13.97L15.45,15.8L17.64,20.5C17.87,21 17.66,21.6 17.16,21.83L13.64,21.97Z"/></svg>') ${cursorSize/4} ${cursorSize/12}, auto !important;
      }
    `;

    // Cursor para elementos interactivos: mano con dedo señalador blanca con borde negro
    const pointerCursor = `
      button, a, input[type="button"], input[type="submit"], select, [role="button"], 
      .MuiButton-root, .MuiIconButton-root, .MuiTab-root, .MuiMenuItem-root, 
      .MuiListItem-root[role="button"], .MuiChip-root, .MuiSwitch-root,
      [onclick], [onmousedown] {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><defs><filter id="shadow2"><feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" flood-color="black"/></filter></defs><path fill="white" stroke="black" stroke-width="1.5" filter="url(%23shadow2)" d="M10,9A1,1 0 0,1 11,8A1,1 0 0,1 12,9V13.47L13.21,13.6L18.15,15.79C18.68,16.03 19,16.56 19,17.14V21.5C18.97,22.32 18.32,22.97 17.5,23H11C10.62,23 10.26,22.85 10,22.57L5.1,18.37L5.84,17.6C6.03,17.39 6.3,17.28 6.58,17.28H6.8L10,19V9M11,5A4,4 0 0,1 15,9C15,10.5 14.2,11.77 13,12.46V11.24C13.61,10.69 14,9.89 14,9A3,3 0 0,0 11,6A3,3 0 0,0 8,9C8,9.89 8.39,10.69 9,11.24V12.46C7.8,11.77 7,10.5 7,9A4,4 0 0,1 11,5Z"/></svg>') ${cursorSize/3} ${cursorSize/6}, pointer !important;
      }
    `;

    // Cursor para campos de texto: I-beam blanca con borde negro
    const textCursor = `
      input[type="text"], input[type="password"], input[type="email"], 
      input[type="search"], input[type="tel"], input[type="url"], 
      textarea, [contenteditable="true"], .MuiInputBase-input {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><defs><filter id="shadow3"><feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" flood-color="black"/></filter></defs><path fill="white" stroke="black" stroke-width="1.5" filter="url(%23shadow3)" d="M13,19A1,1 0 0,0 14,20H18V22H13.5C12.95,22 12,21.55 12,21C12,21.55 11.05,22 10.5,22H6V20H10A1,1 0 0,0 11,19V5A1,1 0 0,0 10,4H6V2H10.5C11.05,2 12,2.45 12,3C12,2.45 12.95,2 13.5,2H18V4H14A1,1 0 0,0 13,5V19Z"/></svg>') ${cursorSize/2} ${cursorSize/2}, text !important;
      }
    `;

    // Cursor para gutters horizontales (col-resize)
    const colResizeCursor = `
      .gutter-horizontal {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><defs><filter id="shadow4"><feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" flood-color="black"/></filter></defs><path fill="white" stroke="black" stroke-width="1.5" filter="url(%23shadow4)" d="M8,18H11V15H2V13H22V15H13V18H16L12,22L8,18M12,2L8,6H11V9H2V11H22V9H13V6H16L12,2Z"/></svg>') ${cursorSize/2} ${cursorSize/2}, col-resize !important;
      }
      
      .gutter-horizontal:active {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><defs><filter id="shadow5"><feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" flood-color="black"/></filter></defs><path fill="white" stroke="black" stroke-width="2" filter="url(%23shadow5)" d="M8,18H11V15H2V13H22V15H13V18H16L12,22L8,18M12,2L8,6H11V9H2V11H22V9H13V6H16L12,2Z"/></svg>') ${cursorSize/2} ${cursorSize/2}, col-resize !important;
      }
    `;

    // Cursor para gutters verticales (row-resize)
    const rowResizeCursor = `
      .gutter-vertical {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><defs><filter id="shadow6"><feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" flood-color="black"/></filter></defs><path fill="white" stroke="black" stroke-width="1.5" filter="url(%23shadow6)" d="M18,16V13H15V22H13V2H15V11H18V8L22,12L18,16M2,12L6,16V13H9V22H11V2H9V11H6V8L2,12Z"/></svg>') ${cursorSize/2} ${cursorSize/2}, row-resize !important;
      }
      
      .gutter-vertical:active {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><defs><filter id="shadow7"><feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" flood-color="black"/></filter></defs><path fill="white" stroke="black" stroke-width="2" filter="url(%23shadow7)" d="M18,16V13H15V22H13V2H15V11H18V8L22,12L18,16M2,12L6,16V13H9V22H11V2H9V11H6V8L2,12Z"/></svg>') ${cursorSize/2} ${cursorSize/2}, row-resize !important;
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
    styleElement.textContent = normalCursor + pointerCursor + textCursor + colResizeCursor + rowResizeCursor + fontStyle;

    return () => {
      // Cleanup si es necesario
    };
  }, [cursorSize, fontSize]);


  const handleKeyDown = (event) => {
    if (event.altKey && event.key === 's') {
      event.preventDefault();
      handleSaveFile();
      return;
    }

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

  // Verificar si hay archivos y manejar enfoque inicial
  useEffect(() => {
    const checkFiles = () => {
      const files = JSON.parse(localStorage.getItem('files')) || [];
      const folders = JSON.parse(localStorage.getItem('folders')) || [];
      const totalFiles = files.length + folders.reduce((acc, f) => acc + f.files.length, 0);
      
      // CAMBIO: Verificar si hay contenido en el editor O archivos en localStorage
      const hasContent = totalFiles > 0 || (editorContent && editorContent.trim() !== '');
      setHasFiles(hasContent);

      // Establecer enfoque inicial solo una vez
      if (!initialFocusSet) {
        setInitialFocusSet(true);
        if (!hasContent) {
          // Si no hay archivos, enfocar Welcome
          setTimeout(() => {
            if (welcomeRef.current) {
              welcomeRef.current.focus();
            }
          }, 600);
        } else {
          // Si hay archivos, enfocar el editor
          setTimeout(() => {
            if (textEditorRef.current) {
              textEditorRef.current.focusEditor();
            }
          }, 600);
        }
      }
    };

    checkFiles();
    
    const handleStorageChange = () => {
      checkFiles();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // NUEVO: Intervalo para verificar cambios en localStorage cada 500ms
    const checkInterval = setInterval(checkFiles, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [editorContent, initialFocusSet]);

  // Aplicar clase al body según el modo
  useEffect(() => {
    if (isKeyboardMode) {
      document.body.classList.add('keyboard-mode');
      document.body.classList.remove('mouse-mode');
    } else {
      document.body.classList.add('mouse-mode');
      document.body.classList.remove('keyboard-mode');
    }

    return () => {
      document.body.classList.remove('keyboard-mode', 'mouse-mode');
    };
  }, [isKeyboardMode]);

  // Cargar primer/último archivo al montar
  useEffect(() => {
    const loadInitialFile = () => {
      const files = JSON.parse(localStorage.getItem('files')) || [];
      const folders = JSON.parse(localStorage.getItem('folders')) || [];
      
      // Intentar cargar el primer archivo sin carpeta
      if (files.length > 0) {
        const firstFile = files[0];
        handleFileOpen(firstFile.name, firstFile.content, firstFile.id);
        return;
      }

      // Si no hay archivos sin carpeta, buscar en carpetas
      for (let folder of folders) {
        if (folder.files && folder.files.length > 0) {
          const firstFile = folder.files[0];
          handleFileOpen(firstFile.name, firstFile.content, firstFile.id);
          return;
        }
      }
    };

    loadInitialFile();
  }, []);

  // Verificar si hay archivos y manejar enfoque inicial
  useEffect(() => {
    const checkFiles = () => {
      const files = JSON.parse(localStorage.getItem('files')) || [];
      const folders = JSON.parse(localStorage.getItem('folders')) || [];
      const totalFiles = files.length + folders.reduce((acc, f) => acc + f.files.length, 0);
      
      const hasContent = totalFiles > 0 || (editorContent && editorContent.trim() !== '');
      setHasFiles(hasContent);

      if (!initialFocusSet) {
        setInitialFocusSet(true);
        if (!hasContent) {
          setTimeout(() => {
            if (welcomeRef.current) {
              welcomeRef.current.focus();
            }
          }, 600);
        } else {
          setTimeout(() => {
            if (textEditorRef.current) {
              textEditorRef.current.focusEditor();
            }
          }, 600);
        }
      }
    };

    checkFiles();
    
    const handleStorageChange = () => {
      checkFiles();
    };
    
    window.addEventListener('storage', handleStorageChange);
    const checkInterval = setInterval(checkFiles, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [editorContent, initialFocusSet]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      width: '100vw',
      overflow: 'hidden'
    }}>
      <Magnifier zoomFactor={magnifierZoom} lensSize={magnifierSize} magnifierEnabled={magnifierEnabled}>
        <Zoom contrast={contrast} setContrast={setContrast} scale={scale} setScale={setScale} magnifierEnabled={magnifierEnabled} screenReaderEnabled={screenReaderEnabled}
      setScreenReaderEnabled={setScreenReaderEnabled}>
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
              minSize={fileManagerCollapsed ? [50, 0] : [200, 0]}
              maxSize={fileManagerCollapsed ? [50, Infinity] : [600, Infinity]}
              gutterSize={8}
              snapOffset={30}
              dragInterval={1}
              cursor="col-resize"
              style={{ 
                display: 'flex', 
                height: '100%',
                width: '100%'
              }}
              className="split-horizontal"
              aria-label="División horizontal entre gestor de archivos y editor"
              onDragStart={() => {
                document.body.style.userSelect = 'none';
              }}
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
                  screenReaderEnabled={screenReaderEnabled}
                  currentFileId={currentFileId}
                  onSaveFile={handleSaveFile}
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
                  {/* Mostrar WelcomeScreen o TextEditor según si hay archivos */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden'
                  }}>
                    {!hasFiles ? (
                      <WelcomeScreen 
                        ref={welcomeRef}
                        contrast={contrast}
                      />
                    ) : (
                      <TextEditor 
                        ref={textEditorRef} 
                        contrast={contrast} 
                        scale={scale} 
                        fontSize={fontSize}
                        setOutput={setOutput} 
                        setCodeStructure={setCodeStructure} 
                        editorContent={editorContent} 
                        setEditorContent={setEditorContent} 
                        setPid={setPid}
                        currentFileName={currentFileName}
                        unsavedChanges={unsavedChanges}
                        onSave={handleSaveFile}
                        role="main"
                        aria-label="Editor de código principal"
                      />
                    )}
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