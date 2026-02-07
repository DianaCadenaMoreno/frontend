import React from 'react';
import Split from 'react-split';
import { Box, Tabs, Tab, Typography, TextField, IconButton, CircularProgress, Button, Collapse, Menu, MenuItem, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, List, ListItem, ListItemText, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import { InsertDriveFile } from '@mui/icons-material';
import { CreateNewFolder } from '@mui/icons-material';
import { Folder } from '@mui/icons-material';
import { FolderOpen } from '@mui/icons-material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import WarningIcon from '@mui/icons-material/Warning';
import generateCode from '../utils/chat';
import useSpeechRecognition from '../utils/speech';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/FileManager.css'
import { useScreenReader } from '../contexts/ScreenReaderContext';
import { useAppNavigation } from '../contexts/NavigationContext';
// import { useInteractionMode } from '../contexts/InteractionModeContext';

// Constantes para límites de almacenamiento
const MAX_FILES = 50;
const MAX_FOLDERS = 20;
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB en bytes

const FileManager = React.forwardRef(({ contrast, codeStructure, onFileOpen, collapsed, onToggleCollapse,screenReaderEnabled,currentFileId, onSaveFile, ...props }, ref) => {

  const [files, setFiles] = React.useState(() => JSON.parse(localStorage.getItem('files')) || []);
  const [folders, setFolders] = React.useState(() => JSON.parse(localStorage.getItem('folders')) || []);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [tabIndex, setTabIndex] = React.useState(0);
  const [prompt, setPrompt] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [isFile, setIsFile] = React.useState(true);
  const [openFolders, setOpenFolders] = React.useState({});
  const [chatHistory, setChatHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const { isListening, transcript, setIsListening } = useSpeechRecognition();
  const [isCodeStructureOpen, setIsCodeStructureOpen] = React.useState(true);
  const [focusedMessageIndex, setFocusedMessageIndex] = React.useState(-1);
  const [copiedIndex, setCopiedIndex] = React.useState(null);
  const chatContainerRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const hasCodeStructure = codeStructure && codeStructure.length > 0;
  const [lastTypedWord, setLastTypedWord] = React.useState('');
  const typingTimeoutRef = React.useRef(null);
  const fileManagerRef = React.useRef(null);
  const { enabled, speak, speakOnHover, speakOnFocus, cancelHoverSpeak, announce, stop } = useScreenReader();
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [storageWarningOpen, setStorageWarningOpen] = React.useState(false);
  const [storageWarningMessage, setStorageWarningMessage] = React.useState('');
  const {registerComponent, unregisterComponent, setFocusedComponent } = useAppNavigation();
  const fileManagerContainerRef = React.useRef(null);
  const [isFileManagerFocused, setIsFileManagerFocused] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const createDialogInputRef = React.useRef(null);
  const renameDialogInputRef = React.useRef(null);
  const [extensionErrorOpen, setExtensionErrorOpen] = React.useState(false);
  const chatPanelRef = React.useRef(null);
  const [focusedCodeIndex, setFocusedCodeIndex] = React.useState(-1);
  const [targetFolderId, setTargetFolderId] = React.useState(null);

  // Función para obtener colores del tema
  const getThemeColors = (contrast) => {
    switch(contrast) {
      case 'high-contrast':
        return {
          background: '#000000',
          surface: '#1a1a1a',
          text: '#ffffff',
          textSecondary: '#858585',
          border: '#404040',
          hover: '#2a2a2a',
          accent: '#f7ff0fff',
          success: '#50fa7b',
          info: '#8be9fd',
          error: '#ff0000',
          warning: '#ffaa00'
        };
      case 'blue-contrast':
        return {
          background: '#0d1117',
          surface: '#1a2332',
          text: '#E0E0E0',
          textSecondary: '#7289DA',
          border: '#2C3E50',
          hover: '#263445',
          accent: '#4FC3F7',
          success: '#81C784',
          info: '#4DD0E1'
        };
      case 'yellow-contrast':
        return {
          background: '#FFFDE7',
          surface: '#FFF9C4',
          text: '#212121',
          textSecondary: '#757575',
          border: '#E0E0E0',
          hover: '#FFECB3',
          accent: '#D32F2F',
          success: '#388E3C',
          info: '#1976D2'
        };
      default:
        return {
          background: '#ffffff',
          surface: '#f5f5f5',
          text: '#000000',
          textSecondary: '#666666',
          border: '#ddd',
          hover: '#f0f0f0',
          accent: '#1976d2',
          success: '#2e7d32',
          info: '#0288d1'
        };
    }
  };

  const validateFileExtension = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    return ext === 'txt' || ext === 'py';
  };

  const themeColors = getThemeColors(contrast);

  // Verificar límites de almacenamiento
  const checkStorageLimits = React.useCallback((newFiles, newFolders) => {
    const totalFiles = newFiles.length + newFolders.reduce((acc, folder) => acc + folder.files.length, 0);
    const totalFolders = newFolders.length;
    
    const testStorage = new Blob([JSON.stringify({ files: newFiles, folders: newFolders })]).size;

    if (totalFiles > MAX_FILES) {
      const message = `Has alcanzado el límite de ${MAX_FILES} archivos. Por favor, elimina algunos archivos antes de agregar más.`;
      setStorageWarningMessage(message);
      setStorageWarningOpen(true);
      announce(message);
      speak(message);
      return false;
    }

    if (totalFolders > MAX_FOLDERS) {
      const message = `Has alcanzado el límite de ${MAX_FOLDERS} carpetas. Por favor, elimina algunas carpetas antes de agregar más.`;
      setStorageWarningMessage(message);
      setStorageWarningOpen(true);
      announce(message);
      speak(message);
      return false;
    }

    if (testStorage > MAX_STORAGE_SIZE) {
      const sizeMB = (testStorage / (1024 * 1024)).toFixed(2);
      const maxMB = (MAX_STORAGE_SIZE / (1024 * 1024)).toFixed(2);
      const message = `Has alcanzado el límite de almacenamiento de ${maxMB} MB. Actualmente usas ${sizeMB} MB. Por favor, elimina algunos archivos o carpetas.`;
      setStorageWarningMessage(message);
      setStorageWarningOpen(true);
      announce(message);
      speak(message);
      return false;
    }

    // Advertencia al 80%
    if (testStorage > MAX_STORAGE_SIZE * 0.8 && testStorage <= MAX_STORAGE_SIZE) {
      const percent = ((testStorage / MAX_STORAGE_SIZE) * 100).toFixed(0);
      const message = `Advertencia: Has usado el ${percent}% del espacio de almacenamiento disponible.`;
      announce(message);
      speakOnHover(message, 100);
    }

    return true;
  }, [announce, speak, speakOnHover]);

  // Función para abrir menú contextual
  const handleContextMenu = React.useCallback((event, item) => {
    event.preventDefault();
    event.stopPropagation();

    let mouseX = event.clientX;
    let mouseY = event.clientY;

    // Si viene desde teclado (Enter/tecla de menú), clientX/Y suelen ser 0.
    // En ese caso, anclamos el menú al elemento actual.
    if (mouseX === 0 && mouseY === 0 && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      mouseX = rect.left + rect.width / 2;
      mouseY = rect.top + rect.height;
    }

    setContextMenu({
      mouseX,
      mouseY,
    });
    setSelectedItem(item);
    
    const itemType = item.type === 'folder' ? 'carpeta' : 'archivo';
    const isCurrent = item.type === 'file' && currentFileId === item.id;
    const options = item.type === 'folder'
      ? 'Expandir o colapsar, Crear archivo, Renombrar, Eliminar'
      : isCurrent 
        ? 'Abrir, Guardar, Renombrar, Eliminar, Descargar'
        : 'Abrir, Renombrar, Eliminar, Descargar';
    
    speak(`Menú contextual abierto para ${itemType} ${item.name}. Opciones: ${options}`);
  }, [speak, currentFileId]);

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Manejar cambios en el input de crear con lectura
  const handleCreateDialogChange = React.useCallback((e) => {
    const newValue = e.target.value;
    setNewName(newValue);

    // Leer cada carácter o palabra mientras escribe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Leer la última palabra escrita
    const words = newValue.trim().split(/\s+/);
    const lastWord = words[words.length - 1];
    
    if (newValue.endsWith(' ') && lastWord && lastWord.length > 1) {
      speak(lastWord, { rate: 1.5 });
    }

    // Leer todo después de una pausa
    typingTimeoutRef.current = setTimeout(() => {
      if (newValue.trim()) {
        speak(`Nombre actual: ${newValue}`, { rate: 1.3 });
      }
    }, 1500);
  }, [speak]);

  // Manejar cambios en el input de renombrar con lectura
  const handleRenameDialogChange = React.useCallback((e) => {
    const newValue = e.target.value;
    setNewName(newValue);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const words = newValue.trim().split(/\s+/);
    const lastWord = words[words.length - 1];
    
    if (newValue.endsWith(' ') && lastWord && lastWord.length > 1) {
      speak(lastWord, { rate: 1.5 });
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (newValue.trim()) {
        speak(`Nuevo nombre: ${newValue}`, { rate: 1.3 });
      }
    }, 1500);
  }, [speak]);

  // Efecto para enfocar y anunciar cuando se abre el diálogo de crear
  React.useEffect(() => {
    if (dialogOpen) {
      // Detener navegación en el gestor de archivos
      stop();
      
      // Pequeño delay para que el diálogo se renderice completamente
      setTimeout(() => {
        const dialogType = isFile ? 'archivo' : 'carpeta';
        speak(`Diálogo de crear nuevo ${dialogType}. Ingresa el nombre y presiona Enter para crear o Escape para cancelar. Tab para navegar entre campos y botones`, { rate: 1.2 });
        
        if (createDialogInputRef.current) {
          createDialogInputRef.current.focus();
        }
      }, 100);
    }
  }, [dialogOpen, isFile, speak, stop]);

  // Efecto para enfocar y anunciar cuando se abre el diálogo de renombrar
  React.useEffect(() => {
    if (renameDialogOpen && selectedItem) {
      stop();
      
      setTimeout(() => {
        const itemType = selectedItem.type === 'folder' ? 'carpeta' : 'archivo';
        speak(`Diálogo de renombrar ${itemType}. Nombre actual: ${selectedItem.name}. Ingresa el nuevo nombre y presiona Enter para confirmar o Escape para cancelar`, { rate: 1.2 });
        
        if (renameDialogInputRef.current) {
          renameDialogInputRef.current.focus();
        }
      }, 100);
    }
  }, [renameDialogOpen, selectedItem, speak, stop]);

  // Efecto para anunciar cuando se abre el diálogo de eliminar
  React.useEffect(() => {
    if (deleteDialogOpen && selectedItem) {
      stop();
      
      setTimeout(() => {
        const itemType = selectedItem.type === 'folder' ? 'carpeta' : 'archivo';
        const message = `Diálogo de confirmación. ¿Estás seguro de eliminar ${itemType} ${selectedItem.name}? ${selectedItem.type === 'folder' ? 'Esto eliminará todos los archivos dentro de la carpeta. ' : ''}Presiona Tab para navegar entre botones. Enter para confirmar o Escape para cancelar`;
        speak(message, { rate: 1.2 });
      }, 100);
    }
  }, [deleteDialogOpen, selectedItem, speak, stop]);

  // Manejar teclas en diálogo de crear
  const handleCreateDialogKeyDown = React.useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      stop();
      setDialogOpen(false);
      setNewName('');
      speak('Diálogo cancelado');
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [stop, speak]);

  // Manejar teclas en diálogo de renombrar
  const handleRenameDialogKeyDown = React.useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      stop();
      setRenameDialogOpen(false);
      setNewName('');
      speak('Diálogo cancelado');
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [stop, speak]);

  // Efecto para anunciar cuando se abre el diálogo de almacenamiento
  React.useEffect(() => {
    if (storageWarningOpen) {
      stop();
      
      setTimeout(() => {
        speak(`Advertencia de almacenamiento. ${storageWarningMessage}. Presiona Enter o Escape para cerrar`, { rate: 1.2 });
      }, 100);
    }
  }, [storageWarningOpen, storageWarningMessage, speak, stop]);

  // Función para renombrar
  const handleRename = React.useCallback(() => {
    if (!selectedItem) return;
    setNewName(selectedItem.name);
    setRenameDialogOpen(true);
    handleCloseContextMenu();
    
    const itemType = selectedItem.type === 'folder' ? 'carpeta' : 'archivo';
    speak(`Diálogo de renombrar ${itemType} abierto. Nombre actual: ${selectedItem.name}`);
  }, [selectedItem, speak]);

  const confirmRename = React.useCallback(() => {
    if (!selectedItem || !newName.trim()) {
      speak('El nombre no puede estar vacío');
      return;
    }

    const itemType = selectedItem.type;
    const itemId = selectedItem.id;

    if (itemType === 'file') {
      // Determinar extensión para archivos
      let fileName = newName.trim();
      
      // Si no tiene extensión, mantener la extensión original
      if (!fileName.includes('.')) {
        const originalExt = selectedItem.name.split('.').pop();
        fileName = `${fileName}.${originalExt}`;
      }
      
      // Validar extensión
      if (!validateFileExtension(fileName)) {
        speak('Solo se permiten archivos con extensión .txt o .py');
        setExtensionErrorOpen(true);
        return;
      }

      // Verificar si es un archivo de carpeta o archivo raíz
      if (selectedItem.parentFolder) {
        setFolders(prev => prev.map(folder => {
          if (folder.id === selectedItem.parentFolder) {
            return {
              ...folder,
              files: folder.files.map(f => 
                f.id === itemId ? { ...f, name: fileName } : f
              )
            };
          }
          return folder;
        }));
      } else {
        setFiles(prev => prev.map(f => 
          f.id === itemId ? { ...f, name: fileName } : f
        ));
      }
      speak(`Archivo renombrado a ${fileName}`);
    } else {
      setFolders(prev => prev.map(f => 
        f.id === itemId ? { ...f, name: newName } : f
      ));
      speak(`Carpeta renombrada a ${newName}`);
    }

    setRenameDialogOpen(false);
    setNewName('');
    setSelectedItem(null);
  }, [selectedItem, newName, speak, setFolders, setFiles]);

  // Función para eliminar
  const handleDelete = React.useCallback(() => {
    if (!selectedItem) return;
    setDeleteDialogOpen(true);
    handleCloseContextMenu();
    
    const itemType = selectedItem.type === 'folder' ? 'carpeta' : 'archivo';
    speak(`Confirmar eliminación de ${itemType} ${selectedItem.name}`);
  }, [selectedItem, speak]);

  const confirmDelete = React.useCallback(() => {
    if (!selectedItem) return;

    const itemType = selectedItem.type;
    const itemId = selectedItem.id;

    if (itemType === 'file') {
      if (selectedItem.parentFolder) {
        setFolders(prev => prev.map(folder => {
          if (folder.id === selectedItem.parentFolder) {
            return {
              ...folder,
              files: folder.files.filter(f => f.id !== itemId)
            };
          }
          return folder;
        }));
      } else {
        setFiles(prev => prev.filter(f => f.id !== itemId));
      }
      speak(`Archivo ${selectedItem.name} eliminado correctamente`);
    } else {
      setFolders(prev => prev.filter(f => f.id !== itemId));
      speak(`Carpeta ${selectedItem.name} y todos sus archivos eliminados correctamente`);
    }

    setDeleteDialogOpen(false);
    setSelectedItem(null);
  }, [selectedItem, speak]);

  // Función para descargar
  const handleDownload = React.useCallback(() => {
    if (!selectedItem || selectedItem.type !== 'file') return;

    const content = selectedItem.content || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedItem.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    handleCloseContextMenu();
    speak(`Archivo ${selectedItem.name} descargado correctamente`);
  }, [selectedItem, speak]);

  // Obtener elementos navegables según la sección actual
  const getNavigableElements = React.useCallback(() => {
  if (tabIndex === 1) {
    return [];
  }

  const elements = [];
  
  // Agregar carpetas
  folders.forEach(folder => {
    if (folder && folder.id && folder.name) {
      elements.push({ 
        ...folder, 
        type: 'folder',
        files: folder.files || [] // Asegurar que files existe
      });
      
      // Si la carpeta está abierta, agregar sus archivos
      // if (openFolders[folder.id] && folder.files && Array.isArray(folder.files)) {
      //   folder.files.forEach(file => {
      //     if (file && file.id && file.name) {
      //       elements.push({ 
      //         ...file, 
      //         type: 'file', 
      //         parentFolder: folder.id 
      //       });
      //     }
      //   });
      // }
    }
  });
  
  // Agregar archivos sin carpeta
  files.forEach(file => {
    if (file && file.id && file.name && !file.parentFolder) {
      elements.push({ ...file, type: 'file' });
    }
  });
  
  return elements;
}, [folders, files, openFolders, tabIndex]);

  // Función para extraer bloques de código
  const extractCodeBlocks = React.useCallback((content) => {
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const blocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        content: match[2].trim()
      });
    }
    
    return blocks;
  }, []);

  // Componente ChatHistory
  const ChatHistory = ({ chatHistory, themeColors, focusedMessageIndex, focusedCodeIndex, copiedIndex }) => {
    return (
      <div>
        {chatHistory.map((message, messageIndex) => {
          const content = typeof message.content === 'string' ? message.content : String(message.content || '');
          const isFocused = focusedMessageIndex === messageIndex;
          const codeBlocks = extractCodeBlocks(content);

          return (
            <div
              key={messageIndex}
              tabIndex={isFocused ? 0 : -1}
              role="article"
              aria-label={`Mensaje ${messageIndex + 1} de ${chatHistory.length}. ${message.role === "user" ? "Tu mensaje" : "Respuesta del copiloto"}${codeBlocks.length > 0 ? `. Contiene ${codeBlocks.length} bloque${codeBlocks.length > 1 ? 's' : ''} de código` : ''}`}
              style={{
                marginBottom: "16px",
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: isFocused ? themeColors.hover : 'transparent',
                border: isFocused ? `3px solid ${themeColors.accent}` : '2px solid transparent',
                outline: 'none',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Typography style={{
                  color: themeColors.text,
                  fontWeight: 700,
                  fontSize: '0.95rem'
                }}>
                  {message.role === "user" ? "Tú" : "Copiloto"}
                  {codeBlocks.length > 0 && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '0.7rem',
                      backgroundColor: themeColors.accent,
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px'
                    }}>
                      {codeBlocks.length} código{codeBlocks.length > 1 ? 's' : ''}
                    </span>
                  )}
                </Typography>
              </div>

              <ReactMarkdown
                children={content}
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => (
                    <Typography
                      {...props}
                      style={{
                        color: themeColors.text,
                        marginBottom: "8px",
                        lineHeight: "1.5",
                        fontSize: '0.9rem'
                      }}
                    />
                  ),
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match?.[1]?.toLowerCase() || null;

                    if (inline || language !== 'python') {
                      return (
                        <code
                          {...props}
                          style={{
                            backgroundColor: themeColors.surface,
                            color: themeColors.accent,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '0.85em',
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                          }}
                        >
                          {children}
                        </code>
                      );
                    }


                    // Encontrar el índice de este bloque de código
                    const codeContent = String(children).trim();
                    const blockIndex = codeBlocks.findIndex(block => block.content === codeContent);
                    const isCodeFocused = isFocused && focusedCodeIndex === blockIndex;
                    const isCopied = copiedIndex === `${messageIndex}-${blockIndex}`;

                    return (
                      <div style={{ position: 'relative', margin: '12px 0' }}>
                        <pre 
                          style={{
                            backgroundColor: isCodeFocused ? themeColors.accent : themeColors.surface,
                            padding: '12px',
                            borderRadius: '6px',
                            border: isCodeFocused ? `3px solid ${themeColors.accent}` : `1px solid ${themeColors.border}`,
                            margin: 0,
                            overflow: 'auto',
                            fontSize: '0.85rem',
                            lineHeight: '1.4',
                            position: 'relative'
                          }}
                          aria-label={`Bloque de código ${blockIndex + 1}${isCodeFocused ? ', enfocado' : ''}. Presiona Tab para navegar códigos, C para copiar, Enter para leer`}
                        >
                          {/* Indicador de foco para código */}
                          {isCodeFocused && (
                            <div style={{
                              position: 'absolute',
                              top: '-2px',
                              right: '8px',
                              backgroundColor: themeColors.accent,
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '0 0 4px 4px',
                              fontSize: '0.7rem',
                              fontWeight: 'bold'
                            }}>
                              Código {blockIndex + 1}/{codeBlocks.length} - ENFOCADO
                            </div>
                          )}
                          
                          <code
                            {...props}
                            style={{
                              color: isCodeFocused ? themeColors.background : themeColors.text,
                              fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                            }}
                          >
                            {children}
                          </code>
                        </pre>
                        
                        {/* Botón de copiar para cada bloque de código */}
                        <button
                          type="button"
                          
                          aria-label={isCopied ? 'Código copiado' : `Copiar código ${blockIndex + 1}`}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: isCopied ? (themeColors.success || '#4caf50') : themeColors.accent,
                            color: '#ffffff',
                            fontSize: '0.7rem',
                            minWidth: '70px',
                            height: '28px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            zIndex: 10,
                            fontFamily: 'inherit',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onMouseOver={(e) => {
                            if (!isCopied) {
                              e.target.style.transform = 'scale(1.05)';
                              e.target.style.filter = 'brightness(0.9)';
                            }
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.filter = 'brightness(1)';
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            navigator.clipboard.writeText(codeContent).then(() => {
                              setCopiedIndex(`${messageIndex}-${blockIndex}`);
                              speak('Código copiado al portapapeles');

                              setTimeout(() => {
                                setCopiedIndex(null);
                              }, 2000);
                            });
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseUp={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onFocus={(e) => {
                            e.target.style.outline = `2px solid ${themeColors.background}`;
                            e.target.style.outlineOffset = '2px';
                          }}
                          onBlur={(e) => {
                            e.target.style.outline = 'none';
                          }}
                        >
                          {isCopied ? '✓ Copiado' : 'Copiar'}
                        </button>
                      </div>
                    );
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Manejar navegación por teclado en el chat
  const handleChatKeyDown = React.useCallback((e) => {
    const isInteractiveElement =
    e.target instanceof HTMLButtonElement ||
    e.target.getAttribute('role') === 'button';

    if (tabIndex !== 1) return;

    const tag = e.target.tagName;

    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(tag)) {
      return; // NO SE USA navegación global aquí
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      stop();

      // Volver a Archivos
      setTabIndex(0);

      // Devolver foco al FileManager
      fileManagerContainerRef.current?.focus();

      speak('Volviendo al gestor de archivos');
      return;
    }
    
    const isInTextField = e.target === inputRef.current;

    // Navegación desde el input
    if (isInTextField) {
      if (e.key === 'Escape' && chatHistory.length > 0) {
        e.preventDefault();
        setFocusedMessageIndex(chatHistory.length - 1);
        inputRef.current.blur();
        const lastMessage = chatHistory[chatHistory.length - 1];
        const role = lastMessage.role === 'user' ? 'Tu mensaje' : 'Respuesta del copiloto';
        speak(`Navegación de mensajes activada. Mensaje ${chatHistory.length} de ${chatHistory.length}. ${role}. Usa flechas para navegar, Enter para leer, Tab para navegar códigos, i para volver al input`);
      }
      // Navegación rápida con Ctrl
      else if (e.key === 'ArrowUp' && e.ctrlKey && chatHistory.length > 0) {
        e.preventDefault();
        setFocusedMessageIndex(chatHistory.length - 1);
        inputRef.current.blur();
        const lastMessage = chatHistory[chatHistory.length - 1];
        const role = lastMessage.role === 'user' ? 'Tu mensaje' : 'Respuesta del copiloto';
        speak(`Último mensaje. ${role}`);
      }
      return;
    }

    // Navegación en mensajes
    switch (e.key) {
      case 'i':
      case 'I':
        e.preventDefault();
        setFocusedMessageIndex(-1);
        setFocusedCodeIndex(-1);
        if (inputRef.current) {
          inputRef.current.focus();
          speak('Campo de texto enfocado');
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (focusedCodeIndex >= 0) {
          // Si estamos en código, navegar entre códigos del mismo mensaje
          const message = chatHistory[focusedMessageIndex];
          const codeBlocks = extractCodeBlocks(message.content);
          const newCodeIndex = focusedCodeIndex > 0 ? focusedCodeIndex - 1 : codeBlocks.length - 1;
          setFocusedCodeIndex(newCodeIndex);
          speak(`Bloque de código ${newCodeIndex + 1} de ${codeBlocks.length}`);
        } else {
          // Navegar entre mensajes
          setFocusedMessageIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : chatHistory.length - 1;
            const message = chatHistory[newIndex];
            const role = message.role === 'user' ? 'Tu mensaje' : 'Respuesta del copiloto';
            const codeBlocks = extractCodeBlocks(message.content);
            const hasCode = codeBlocks.length > 0;
            speak(`Mensaje ${newIndex + 1} de ${chatHistory.length}. ${role}${hasCode ? `. Contiene ${codeBlocks.length} bloque${codeBlocks.length > 1 ? 's' : ''} de código` : ''}`);
            return newIndex;
          });
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (focusedCodeIndex >= 0) {
          // Si estamos en código, navegar entre códigos del mismo mensaje
          const message = chatHistory[focusedMessageIndex];
          const codeBlocks = extractCodeBlocks(message.content);
          const newCodeIndex = focusedCodeIndex < codeBlocks.length - 1 ? focusedCodeIndex + 1 : 0;
          setFocusedCodeIndex(newCodeIndex);
          speak(`Bloque de código ${newCodeIndex + 1} de ${codeBlocks.length}`);
        } else {
          // Navegar entre mensajes
          setFocusedMessageIndex(prev => {
            const newIndex = prev < chatHistory.length - 1 ? prev + 1 : 0;
            const message = chatHistory[newIndex];
            const role = message.role === 'user' ? 'Tu mensaje' : 'Respuesta del copiloto';
            const codeBlocks = extractCodeBlocks(message.content);
            const hasCode = codeBlocks.length > 0;
            speak(`Mensaje ${newIndex + 1} de ${chatHistory.length}. ${role}${hasCode ? `. Contiene ${codeBlocks.length} bloque${codeBlocks.length > 1 ? 's' : ''} de código` : ''}`);
            return newIndex;
          });
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (focusedMessageIndex >= 0) {
          const message = chatHistory[focusedMessageIndex];
          const codeBlocks = extractCodeBlocks(message.content);
          
          if (codeBlocks.length > 0) {
            if (focusedCodeIndex < 0) {
              // Entrar al primer bloque de código
              setFocusedCodeIndex(0);
              speak(`Navegando códigos. Bloque 1 de ${codeBlocks.length}. Presiona Enter para leer, C para copiar, Tab para siguiente código, Escape para volver a mensajes`);
            } else if (focusedCodeIndex < codeBlocks.length - 1) {
              // Ir al siguiente bloque de código
              setFocusedCodeIndex(prev => prev + 1);
              speak(`Bloque de código ${focusedCodeIndex + 2} de ${codeBlocks.length}`);
            } else {
              // Salir de navegación de códigos
              setFocusedCodeIndex(-1);
              speak('Volviendo a navegación de mensajes');
            }
          } else {
            speak('Este mensaje no contiene bloques de código');
          }
        }
        break;

      case 'Enter':
        if (isInteractiveElement) return; 
        e.preventDefault();
        if (focusedMessageIndex >= 0) {
          const message = chatHistory[focusedMessageIndex];
          
          if (focusedCodeIndex >= 0) {
            // Leer solo el código enfocado
            const codeBlocks = extractCodeBlocks(message.content);
            if (codeBlocks[focusedCodeIndex]) {
              const codeContent = codeBlocks[focusedCodeIndex].content;
              speak(`Código Python: ${codeContent}`, { rate: 0.9 });
            }
          } else {
            // Leer el mensaje completo
            const textContent = message.content
              .replace(/```[\s\S]*?```/g, ' [bloque de código] ')
              .replace(/`([^`]+)`/g, '$1')
              .replace(/\*\*([^*]+)\*\*/g, '$1')
              .replace(/\*([^*]+)\*/g, '$1')
              .replace(/#{1,6}\s/g, '')
              .trim();
            speak(textContent, { rate: 1.1 });
          }
        }
        break;

      case 'c':
      case 'C':
        e.preventDefault();
        if (focusedMessageIndex >= 0) {
          const message = chatHistory[focusedMessageIndex];
          
          if (focusedCodeIndex >= 0) {
            // Copiar el código enfocado
            const codeBlocks = extractCodeBlocks(message.content);
            if (codeBlocks[focusedCodeIndex]) {
              const codeContent = codeBlocks[focusedCodeIndex].content;
              navigator.clipboard.writeText(codeContent).then(() => {
                setCopiedIndex(`${focusedMessageIndex}-${focusedCodeIndex}`);
                speak('Código copiado al portapapeles');
                setTimeout(() => setCopiedIndex(null), 2000);
              });
            }
          } else {
            // Copiar el primer código del mensaje (comportamiento anterior)
            const codeBlocks = extractCodeBlocks(message.content);
            if (codeBlocks.length > 0) {
              const codeContent = codeBlocks[0].content;
              navigator.clipboard.writeText(codeContent).then(() => {
                setCopiedIndex(`${focusedMessageIndex}-0`);
                speak('Código copiado al portapapeles');
                setTimeout(() => setCopiedIndex(null), 2000);
              });
            } else {
              speak('No hay código Python en este mensaje');
            }
          }
        }
        break;

      // Tecla R para leer solo código
      case 'r':
      case 'R':
        e.preventDefault();
        if (focusedMessageIndex >= 0) {
          const message = chatHistory[focusedMessageIndex];
          const codeBlocks = extractCodeBlocks(message.content);
          
          if (focusedCodeIndex >= 0 && codeBlocks[focusedCodeIndex]) {
            // Leer el código enfocado
            const codeContent = codeBlocks[focusedCodeIndex].content;
            speak(`Código Python: ${codeContent}`, { rate: 0.9 });
          } else if (codeBlocks.length > 0) {
            // Leer el primer código si no hay ninguno enfocado
            const codeContent = codeBlocks[0].content;
            speak(`Código Python: ${codeContent}`, { rate: 0.9 });
          } else {
            speak('No hay código Python en este mensaje');
          }
        }
        break;

      // Tecla S para leer resumen del mensaje
      case 's':
      case 'S':
        e.preventDefault();
        if (focusedMessageIndex >= 0) {
          const message = chatHistory[focusedMessageIndex];
          const role = message.role === 'user' ? 'Tu mensaje' : 'Respuesta del copiloto';
          const codeBlocks = extractCodeBlocks(message.content);
          const hasCode = codeBlocks.length > 0;
          const wordCount = message.content.trim().split(/\s+/).length;
          const summary = `${role}, ${wordCount} palabras${hasCode ? `, contiene ${codeBlocks.length} bloque${codeBlocks.length > 1 ? 's' : ''} de código` : ''}. Presiona Enter para leer completo, Tab para navegar códigos, R para leer código, C para copiar`;
          speak(summary);
        }
        break;

      // Spacebar para pausar/reanudar lectura
      case ' ':
        e.preventDefault();
        if (window.speechSynthesis.speaking) {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            speak('Lectura reanudada', { rate: 1.5 });
          } else {
            window.speechSynthesis.pause();
            speak('Lectura pausada', { rate: 1.5 });
          }
        }
        break;
    }
  }, [tabIndex, chatHistory, focusedMessageIndex, focusedCodeIndex, speak, stop]);

  // Manejar navegación por teclado
  const handleKeyDown = (e) => {
    if (collapsed) return;

    if (tabIndex === 1) {
      handleChatKeyDown(e);
    }
  };

  // Función para leer el texto mientras se escribe dentro del input para enviar un prompt
  const handlePromptChange = React.useCallback((e) => {
    const newValue = e.target.value;
    setPrompt(newValue);

    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Detectar si se escribió una palabra completa (terminó con espacio, punto, coma, etc.)
    const words = newValue.trim().split(/\s+/);
    const lastWord = words[words.length - 1];
    
    // Si hay un espacio al final o un signo de puntuación, leer la última palabra
    if (newValue.endsWith(' ') || newValue.endsWith('.') || newValue.endsWith(',') || newValue.endsWith('?') || newValue.endsWith('!')) {
      if (lastWord && lastWord !== lastTypedWord && lastWord.length > 2) {
        // Leer la palabra con una velocidad más rápida y sin delay
        speak(lastWord, { rate: 1.5 });
        setLastTypedWord(lastWord);
      }
    }

    // Si el usuario hace una pausa de 1.5 segundos, leer lo que ha escrito hasta ahora
    typingTimeoutRef.current = setTimeout(() => {
      const currentText = newValue.trim();
      if (currentText && currentText.length > lastTypedWord.length + 5) {
        // Leer las últimas palabras (aproximadamente las últimas 3-5 palabras)
        const recentWords = currentText.split(/\s+/).slice(-5).join(' ');
        speak(recentWords, { rate: 1.4 });
        setLastTypedWord(currentText);
      }
    }, 1500);
  }, [prompt, lastTypedWord, speak]);

  const handleCreateFile = () => {
    // Verificar límites antes de crear
    const testFiles = [...files, { id: Date.now(), name: 'test', content: '', type: 'file' }];
    if (!checkStorageLimits(testFiles, folders)) return;

    setIsFile(true);
    setTargetFolderId(null);
    setNewName('');
    setDialogOpen(true);
    speak('Diálogo de crear nuevo archivo abierto');
  };

  const handleCreateFolder = () => {
    // Verificar límites antes de crear
    const testFolders = [...folders, { id: Date.now(), name: 'test', files: [], type: 'folder' }];
    if (!checkStorageLimits(files, testFolders)) return;

    setIsFile(false);
    setTargetFolderId(null);
    setNewName('');
    setDialogOpen(true);
    speak('Diálogo de crear nueva carpeta abierto');
  };

  const handleCreateFileInFolder = React.useCallback(() => {
    if (!selectedItem || selectedItem.type !== 'folder') return;

    const tempFile = { id: Date.now(), name: 'test', content: '', type: 'file', parentFolder: selectedItem.id };
    const testFolders = folders.map(folder =>
      folder.id === selectedItem.id
        ? { ...folder, files: [...(folder.files || []), tempFile] }
        : folder
    );

    if (!checkStorageLimits(files, testFolders)) return;

    setIsFile(true);
    setTargetFolderId(selectedItem.id);
    setNewName('');
    setDialogOpen(true);
    speak(`Diálogo de crear nuevo archivo dentro de la carpeta ${selectedItem.name} abierto`);
    handleCloseContextMenu();
  }, [selectedItem, folders, files, checkStorageLimits, speak]);

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.py,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'py' && ext !== 'txt') {
          const message = 'Solo se pueden abrir archivos Python (.py) y archivos de texto (.txt)';
          announce(message);
          speak(message);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const newFile = {
            id: Date.now(),
            name: file.name,
            content: event.target.result,
            type: 'file'
          };
          
          const testFiles = [...files, newFile];
          if (!checkStorageLimits(testFiles, folders)) return;

          setFiles(prev => [...prev, newFile]);
          if (onFileOpen) {
            onFileOpen(newFile.name, event.target.result, newFile.id);
          }
          speak(`Archivo ${file.name} abierto correctamente`);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleOpenFolder = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.onchange = (e) => {
      const filesList = Array.from(e.target.files);
      const folderName = filesList[0]?.webkitRelativePath.split('/')[0] || 'Nueva Carpeta';
      
      // Filtrar solo archivos .py y .txt
      const validFiles = filesList.filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        return ext === 'py' || ext === 'txt';
      });

      if (validFiles.length === 0) {
        const message = 'La carpeta no contiene archivos Python (.py) o de texto (.txt)';
        announce(message);
        speak(message);
        return;
      }

      if (validFiles.length !== filesList.length) {
        const skipped = filesList.length - validFiles.length;
        const message = `Se omitieron ${skipped} archivo(s) que no son Python o texto`;
        announce(message);
        speakOnHover(message, 100);
      }

      const newFolder = {
        id: Date.now(),
        name: folderName,
        files: [],
        type: 'folder'
      };

      let filesRead = 0;
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          newFolder.files.push({
            id: Date.now() + Math.random(),
            name: file.name,
            path: file.webkitRelativePath,
            content: event.target.result,
            type: 'file'
          });
          
          filesRead++;
          if (filesRead === validFiles.length) {
            const testFolders = [...folders, newFolder];
            if (!checkStorageLimits(files, testFolders)) return;

            setFolders(prev => [...prev, newFolder]);
            speak(`Carpeta ${folderName} abierta correctamente con ${validFiles.length} archivo(s)`);
          }
        };
        reader.readAsText(file);
      });
    };
    input.click();
  };

  const handleDialogConfirm = () => {
    if (!newName.trim()) {
      speak('El nombre no puede estar vacío');
      return;
    }
    
    if (isFile) {
      let fileName = newName.trim();
      
      // Si no tiene extensión, agregar .txt por defecto
      if (!fileName.includes('.')) {
        fileName = `${fileName}.txt`;
      }
      
      // Validar extensión
      if (!validateFileExtension(fileName)) {
        speak('Solo se permiten archivos con extensión .txt o .py');
        setExtensionErrorOpen(true);
        return;
      }
      
      const newFile = {
        id: Date.now(),
        name: fileName,
        content: '',
        type: 'file',
        parentFolder: targetFolderId || null
      };

      if (targetFolderId) {
        const updatedFolders = folders.map(folder =>
          folder.id === targetFolderId
            ? { ...folder, files: [...(folder.files || []), newFile] }
            : folder
        );

        if (!checkStorageLimits(files, updatedFolders)) return;

        setFolders(updatedFolders);
      } else {
        const testFiles = [...files, newFile];
        if (!checkStorageLimits(testFiles, folders)) return;

        setFiles(prev => [...prev, newFile]);
      }
      
      if (onFileOpen) {
        onFileOpen(fileName, '', newFile.id);
      }
      
      speak(`Archivo ${fileName} creado correctamente y abierto en el editor`);
    } else {
      const newFolder = {
        id: Date.now(),
        name: newName,
        files: [],
        type: 'folder'
      };
      
      const testFolders = [...folders, newFolder];
      if (!checkStorageLimits(files, testFolders)) return;

      setFolders(prev => [...prev, newFolder]);
      speak(`Carpeta ${newName} creada correctamente`);
    }
    
    setDialogOpen(false);
    setNewName('');
    setTargetFolderId(null);
  };;

  // Modificar handleFileClick para incluir la selección visual
  const handleFileClick = (file) => {
    const elements = getNavigableElements();
    const clickedIndex = elements.findIndex(el => 
      el.type === 'file' && el.id === file.id
    );
    
    if (clickedIndex !== -1) {
      setSelectedIndex(clickedIndex);
    }
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'py' || ext === 'txt') {
      if (onFileOpen) {
        onFileOpen(file.name, file.content || '', file.id);
        speak(`Archivo ${file.name} abierto en el editor`);
      } else {
        console.error('onFileOpen no está definido');
        speak(`Error al abrir archivo ${file.name}`);
      }
    } else {
      const message = `El archivo ${file.name} no puede ser abierto. Solo se pueden abrir archivos Python y de texto`;
      announce(message);
      speak(message);
    }
  };

  // Función para guardar archivo actual desde menú contextual
  const handleSaveCurrentFile = React.useCallback(() => {
    if (onSaveFile) {
      onSaveFile();
    }
    handleCloseContextMenu();
  }, [onSaveFile]);

  const toggleFolder = (folderId) => {
    const elements = getNavigableElements();
    const folderIndex = elements.findIndex(el => 
      el.type === 'folder' && el.id === folderId
    );
    
    if (folderIndex !== -1) {
      setSelectedIndex(folderIndex);
    }
    
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  const handleTabChange = (_, newValue) => {
    setTabIndex(newValue);

    speak(
      newValue === 1
        ? 'Chat del copiloto seleccionado'
        : 'Gestor de archivos seleccionado'
    );
  };

  const handleGenerateCode = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);

    // Anunciar envío
    announce('Enviando mensaje al copiloto');
    speak('Mensaje enviado, generando respuesta');

    // Add user message to chat history
    const userMessage = { role: 'user', content: prompt.trim() };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    
    try {
      const response = await generateCode(prompt, setLoading, chatHistory);
      
      // Ensure response is a string
      const responseContent = typeof response === 'string' ? response : String(response || '');
      
      // Add assistant response to chat history
      const assistantMessage = { role: 'assistant', content: responseContent };
      setChatHistory([...updatedHistory, assistantMessage]);

      // Anunciar recepción
      announce('Respuesta del copiloto recibida');
      speak('Respuesta del copiloto lista');

    } catch (error) {
      console.error('Error generating code:', error);
      const errorMessage = { role: 'assistant', content: 'Error al generar respuesta. Inténtalo de nuevo.' };
      setChatHistory([...updatedHistory, errorMessage]);
      speak('Error al generar respuesta');

    } finally {
      setPrompt('');
      setLoading(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
    }
  };

  // Limpiar timeout al desmontar
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Auto-abrir estructura del código cuando hay contenido
  React.useEffect(() => {
    if (codeStructure && codeStructure.length > 0) {
      setIsCodeStructureOpen(true);
    }
  }, [codeStructure]);

  // Focus en el componente al montar
  React.useEffect(() => {
    if (fileManagerRef.current && !collapsed) {
      fileManagerRef.current.focus();
    }
  }, [collapsed]);

  React.useEffect(() => {
    if (transcript) {
      setPrompt(transcript);
    }
  }, [transcript]);

  // Eliminar
  // Sincronizar files con localStorage
  React.useEffect(() => {
    localStorage.setItem('files', JSON.stringify(files));
    window.dispatchEvent(new Event('localStorage-updated'));
  }, [files]);


  // Registrar componente en el sistema de navegación
React.useEffect(() => {
  const fileManagerAPI = {
    focus: () => {
      // Si estamos en chat, cambiar a archivos primero
      if (tabIndex === 1) {
        setTabIndex(1);
        // Esperar a que se actualice el DOM
        requestAnimationFrame(() => {
          fileManagerContainerRef.current?.focus();
          speak('Panel del gestor de archivos. Presiona Tab para navegar entre secciones');
        });
      } else {
        fileManagerContainerRef.current?.focus();
      }
    },
    blur: () => {
      setIsFileManagerFocused(false);
    },
    createFile: handleCreateFile,
    createFolder: handleCreateFolder,
    openFile: handleOpenFile,
    openFolder: handleOpenFolder,
    openChat: () => {
      setTabIndex(1);
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          speak(
            'Chat del copiloto enfocado. Escribe tu mensaje o presiona Escape para salir'
          );
        }
      });
    },
    openStructure: () => {
      setTabIndex(0);
      setSelectedIndex(0);
      speak('Estructura del código');
    }
  };

  registerComponent('filemanager', fileManagerAPI);
  registerComponent('filemanager-create-file', { focus: handleCreateFile });
  registerComponent('filemanager-create-folder', { focus: handleCreateFolder });
  registerComponent('filemanager-open-file', { focus: handleOpenFile });
  registerComponent('filemanager-open-folder', { focus: handleOpenFolder });
  registerComponent('filemanager-chat', { focus: fileManagerAPI.openChat });
  registerComponent('filemanager-structure', { focus: fileManagerAPI.openStructure });

  return () => {
    unregisterComponent('filemanager');
    unregisterComponent('filemanager-create-file');
    unregisterComponent('filemanager-create-folder');
    unregisterComponent('filemanager-open-file');
    unregisterComponent('filemanager-open-folder');
    unregisterComponent('filemanager-chat');
    unregisterComponent('filemanager-structure');
  };
}, [registerComponent, unregisterComponent, speak, tabIndex, files, folders, getNavigableElements]);

  return (
    <Box 
      onKeyDown={(tabIndex === 1 ? handleChatKeyDown : handleKeyDown)}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        width: collapsed ? '50px' : '100%',
        minWidth: collapsed ? '50px' : '200px',
        backgroundColor: themeColors.background,
        color: themeColors.text,
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        borderRight: `1px solid ${themeColors.border}`,
        // outline: 'none'
        outline: isFileManagerFocused
        ? tabIndex === 1
          ? `3px dashed ${themeColors.accent}`
          : `3px solid ${themeColors.accent}`
        : 'none',
        outlineOffset: '-3px'
      }}
      aria-label="Gestor de archivos y chat"
      {...props}
    >
      {/* Header con botón de colapso */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 1,
        borderBottom: `1px solid ${themeColors.border}`,
        flexShrink: 0,
        backgroundColor: themeColors.surface
      }}>
        {!collapsed && (
          <Tabs 
            value={tabIndex} 
            ref={fileManagerContainerRef}
      tabIndex={0}
      onFocus={(e) => {
      if (e.target !== fileManagerContainerRef.current) return;
      setFocusedComponent('filemanager');
      speak(
        tabIndex === 1
          ? 'Panel del chat del copiloto. Presiona Tab para navegar o Escape para salir'
          : 'Panel del gestor de archivos. Presiona Tab para navegar entre secciones'
      );
    }}

      onBlur={(e) => {
        // Solo marcar como no enfocado si el foco sale completamente del FileManager
        if (!fileManagerContainerRef.current?.contains(e.relatedTarget)) {
          setIsFileManagerFocused(false);
        }
      }}
            onChange={handleTabChange} 
            aria-label="Pestañas del administrador de archivos"
            textColor="inherit"
            TabIndicatorProps={{
              style: { backgroundColor: themeColors.accent }
            }}
            sx={{ 
              flex: 1,
              '& .MuiTab-root': {
                color: themeColors.textSecondary,
                fontWeight: 500,
                '&.Mui-selected': {
                  color: themeColors.accent
                }
              }
            }}
          >
            <Tab 
              label="Archivos" 
              aria-label="Pestaña de archivos"
              onMouseEnter={() => speakOnHover('Pestaña de archivos')}
              onFocus={() =>
                speak('Pestaña de archivos seleccionada')
              }
              onMouseLeave={cancelHoverSpeak}
            />
            <Tab 
              label="Chat" 
              aria-label="Pestaña de chat con copiloto"
              onFocus={() =>
                speak('Pestaña de chat con copiloto seleccionada')
              }
              onMouseEnter={() => speakOnHover('Pestaña de chat con copiloto')}
              onMouseLeave={cancelHoverSpeak}
            />
          </Tabs>
        )}
        <IconButton 
          onClick={onToggleCollapse}
          size="small"
          aria-label={collapsed ? "Expandir panel de archivos" : "Colapsar panel de archivos"}
          onMouseEnter={() => speakOnHover(collapsed ? "Expandir panel de archivos" : "Colapsar panel de archivos")}
          onFocus={() =>
            speak(
              collapsed
                ? 'Expandir panel de archivos'
                : 'Colapsar panel de archivos'
            )
          }
          onMouseLeave={cancelHoverSpeak}
          sx={{ 
            ml: collapsed ? 0 : 1,
            color: themeColors.text
          }}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* Contenido */}
      {!collapsed && (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Contenido de Chat */}
          {tabIndex === 1 && (
            <Box 
              ref={chatPanelRef}
              role="region"
              aria-label="Chat del copiloto"
              onFocus={() => {
                speak(
                  'Chat del copiloto. Usa flechas para navegar mensajes, Tab para navegar códigos, i para escribir, Escape para salir'
                );
              }}
              sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                minHeight: 0,
                backgroundColor: themeColors.background
              }}
            >
              <Box 
                ref={chatContainerRef}
                style={{
                  overflowY: 'auto'
                }}
                sx={{ 
                  flexGrow: 1, 
                  overflowY: 'auto', 
                  mb: 2, 
                  padding: 2,
                  minHeight: 0
                }}
              >
                <Typography 
                  variant="h6" 
                  component="h2" 
                  aria-live="polite"
                  sx={{ 
                    color: themeColors.text,
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  Bienvenido a tu copiloto.
                </Typography>
                
                {chatHistory.length === 0 ? (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: themeColors.textSecondary,
                      textAlign: 'center',
                      py: 4,
                      fontStyle: 'italic'
                    }}
                  >
                    No hay mensajes aún. Escribe una pregunta abajo para comenzar.
                  </Typography>
                ) : (
                  <>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: themeColors.textSecondary,
                        display: 'block',
                        mb: 2,
                        fontSize: '0.75rem',
                        lineHeight: 1.6
                      }}
                    >
                      <strong>Navegación por teclado:</strong><br/>
                      • <strong>i</strong> - Ir al campo de entrada para escribir<br/>
                      • <strong>↑/↓</strong> - Navegar entre mensajes<br/>
                      • <strong>Enter</strong> - Leer mensaje completo o copiar código<br/>
                      • <strong>C</strong> - Copiar código<br/>
                      • <strong>Esc</strong> - Detener lectura / Volver a mensajes desde input
                    </Typography>
                    <ChatHistory 
                      chatHistory={chatHistory} 
                      themeColors={themeColors}
                      focusedMessageIndex={focusedMessageIndex}
                      copiedIndex={copiedIndex}
                    /> 
                  </>
                )}
                
                {loading && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 2,
                    mt: 1
                  }}
                  aria-live="polite"
                  aria-busy="true"
                  >
                    <CircularProgress 
                      size={32}
                      sx={{ color: themeColors.accent }} 
                    />
                    <Typography sx={{ 
                      ml: 2, 
                      color: themeColors.textSecondary,
                      fontStyle: 'italic',
                      fontSize: '0.85rem'
                    }}>
                      Generando respuesta...
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ 
                padding: 2, 
                borderTop: `1px solid ${themeColors.border}`,
                flexShrink: 0,
                backgroundColor: themeColors.surface
              }}>
                <TextField
                  inputRef={inputRef}
                  value={prompt}
                  onChange={handlePromptChange}
                  onKeyDown={(e) => {
                    if (e.target !== inputRef.current) return;

                    if (e.key === 'Tab') return;
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      
                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }
                      
                      handleGenerateCode();
                    } else if (e.key === 'Backspace' || e.key === 'Delete') {
                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }
                    }
                  }}
                  onFocus={() => {
                    stop();
                    // setIsKeyboardNavigation(false);
                    setFocusedMessageIndex(-1);
                    // setFocusedCodeButton(null);
                    setLastTypedWord('');
                    speakOnFocus('Campo de texto para hacer preguntas al copiloto. Presiona Enter para enviar o Shift más Enter para nueva línea. Esc para volver a navegar mensajes. Presiona i desde cualquier lugar para volver aquí');
                    
                    if (prompt.trim()) {
                      setTimeout(() => {
                        speak(`Texto actual: ${prompt}`, { rate: 1.3 });
                      }, 3000);
                    }
                  }}
                  onBlur={() => {
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                    setLastTypedWord('');
                  }}
                  placeholder="Escribe o pregunta algo a tu copiloto... (Presiona 'i' desde mensajes para volver aquí)"
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  aria-label="Campo de texto para hacer preguntas al copiloto"
                  aria-live="polite"
                  aria-atomic="false"
                  onMouseEnter={() => speakOnHover('Campo de texto para hacer preguntas al copiloto. Presiona Enter para enviar o Shift más Enter para nueva línea')}
                  onMouseLeave={cancelHoverSpeak}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: themeColors.text,
                      backgroundColor: themeColors.background,
                      '& fieldset': {
                        borderColor: themeColors.border
                      },
                      '&:hover fieldset': {
                        borderColor: themeColors.accent
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: themeColors.accent
                      }
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: themeColors.textSecondary,
                      opacity: 1
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <>
                        <IconButton
                          onClick={() => {
                            stop();
                            if (typingTimeoutRef.current) {
                              clearTimeout(typingTimeoutRef.current);
                            }
                            handleMicClick();
                          }}
                          tabIndex={0}
                          onFocus={() => speakOnFocus(isListening ? "Detener grabación de voz" : "Activar grabación de voz")}
                          aria-label={isListening ? "Detener grabación de voz" : "Activar grabación de voz"}
                          onMouseEnter={() => speakOnHover(isListening ? "Detener grabación de voz" : "Activar grabación de voz")}
                          onMouseLeave={cancelHoverSpeak}
                          sx={{ color: isListening ? '#ff5252' : themeColors.accent }}
                          disabled={loading}
                        >
                          <MicIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => {
                            stop();
                            if (typingTimeoutRef.current) {
                              clearTimeout(typingTimeoutRef.current);
                            }
                            handleGenerateCode();
                          }}
                          tabIndex={0}
                          onFocus={() => speakOnFocus('Enviar mensaje al copiloto')}
                          aria-label="Enviar mensaje al copiloto"
                          onMouseEnter={() => speakOnHover('Enviar mensaje al copiloto')}
                          onMouseLeave={cancelHoverSpeak}
                          sx={{ 
                            color: themeColors.accent,
                            '&.Mui-disabled': {
                              color: themeColors.textSecondary,
                              opacity: 0.5
                            },
                            // Estilo de foco visible
                            '&:focus-visible': {
                              outline: `3px solid ${themeColors.accent}`,
                              outlineOffset: '2px',
                              borderRadius: '6px',
                              backgroundColor: themeColors.hover
                            }
                          }}
                          disabled={!prompt.trim() || loading}
                        >
                          <SendIcon />
                        </IconButton>
                      </>
                    ),
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Contenido de Archivos */}
          {tabIndex === 0 && (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden'
            }}>
              {hasCodeStructure ? (
                <Split
                  direction="vertical"
                  sizes={isCodeStructureOpen ? [60, 40] : [90, 10]}
                  minSize={[150, 50]}
                  maxSize={[undefined, undefined]}
                  gutterSize={8}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: 0
                  }}
                  className="split-vertical-filemanager"
                >
                  {/* Panel superior: Archivos */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                    p: 1,
                    backgroundColor: themeColors.background
                  }}>

                    {/* Información de almacenamiento */}
                    <Box sx={{ 
                      mb: 1,
                      p: 1,
                      backgroundColor: themeColors.surface,
                      borderRadius: 1,
                      border: `1px solid ${themeColors.border}`
                    }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: themeColors.textSecondary,
                          display: 'block'
                        }}
                        aria-live="polite"
                      >
                        Archivos: {files.length + folders.reduce((acc, f) => acc + f.files.length, 0)}/{MAX_FILES} | 
                        Carpetas: {folders.length}/{MAX_FOLDERS}
                      </Typography>
                    </Box>

                    {/* Botones de acción */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 1, 
                      mb: 2
                    }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Crear nuevo archivo">
                          <Button
                            onClick={handleCreateFile}
                            onFocus={() => speakOnFocus('Botón: Crear nuevo archivo de texto')}
                            size="small"
                            variant="outlined"
                            fullWidth
                            aria-label="Crear nuevo archivo de texto"
                            onMouseEnter={() => speakOnHover('Botón: Crear nuevo archivo de texto')}
                            onMouseLeave={cancelHoverSpeak}
                            sx={{ 
                              color: themeColors.text,
                              borderColor: themeColors.border,
                              backgroundColor:  selectedIndex === 0 ? themeColors.hover : 'transparent',
                              '&:hover': {
                                backgroundColor: themeColors.hover,
                                borderColor: themeColors.accent
                              }
                            }}
                          >
                            Nuevo Archivo
                          </Button>
                        </Tooltip>
                        <Tooltip title="Crear nueva carpeta">
                          <Button
                            onClick={handleCreateFolder}
                            onFocus={() => speakOnFocus('Botón: Crear nueva carpeta')}
                            size="small"
                            variant="outlined"
                            fullWidth
                            aria-label="Crear nueva carpeta"
                            onMouseEnter={() => speakOnHover('Botón: Crear nueva carpeta')}
                            onMouseLeave={cancelHoverSpeak}
                            sx={{ 
                              color: themeColors.text,
                              borderColor: themeColors.border,
                              backgroundColor: selectedIndex === 1 ? themeColors.hover : 'transparent',
                              '&:hover': {
                                backgroundColor: themeColors.hover,
                                borderColor: themeColors.accent
                              }
                            }}
                          >
                            Nueva Carpeta
                          </Button>
                        </Tooltip>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Abrir archivo desde el sistema">
                          <Button
                            onClick={handleOpenFile}
                            onFocus={() => speakOnFocus('Botón: Abrir archivo desde el sistema. Solo archivos Python y texto')}
                            size="small"
                            variant="outlined"
                            fullWidth
                            aria-label="Abrir archivo desde el sistema"
                            onMouseEnter={() => speakOnHover('Botón: Abrir archivo desde el sistema. Solo archivos Python y texto')}
                            onMouseLeave={cancelHoverSpeak}
                            sx={{ 
                              color: themeColors.text,
                              borderColor: themeColors.border,
                              backgroundColor: selectedIndex === 2 ? themeColors.hover : 'transparent',
                              '&:hover': {
                                backgroundColor: themeColors.hover,
                                borderColor: themeColors.accent
                              }
                            }}
                          >
                            Abrir Archivo
                          </Button>
                        </Tooltip>
                        <Tooltip title="Abrir carpeta desde el sistema">
                          <Button
                            onClick={handleOpenFolder}
                            onFocus={() => speakOnFocus('Botón: Abrir carpeta desde el sistema. Solo archivos Python y texto')}
                            size="small"
                            variant="outlined"
                            fullWidth
                            aria-label="Abrir carpeta desde el sistema"
                            onMouseEnter={() => speakOnHover('Botón: Abrir carpeta desde el sistema. Solo archivos Python y texto')}
                            onMouseLeave={cancelHoverSpeak}
                            sx={{ 
                              color: themeColors.text,
                              borderColor: themeColors.border,
                              backgroundColor: selectedIndex === 3 ? themeColors.hover : 'transparent',
                              '&:hover': {
                                backgroundColor: themeColors.hover,
                                borderColor: themeColors.accent
                              }
                            }}
                          >
                            Abrir Carpeta
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>

                {/* En la sección sin estructura de código, reemplazar el bloque que renderiza archivos */}
                {/* Lista de archivos */}
                <Box sx={{ 
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 0
                }}>
                  {files.length === 0 && folders.length === 0 && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        textAlign: 'center', 
                        py: 2,
                        color: themeColors.textSecondary,
                        fontStyle: 'italic'
                      }}
                    >
                      No hay archivos abiertos. Usa los botones de arriba para crear o abrir archivos.
                    </Typography>
                  )}

                  {/* Renderizar carpetas */}
                  {folders.filter(folder => folder && folder.id && folder.name).map((folder) => {
                    const elements = getNavigableElements();
                    const folderIndex = elements.findIndex(
                      el => el && el.type === 'folder' && el.id === folder.id
                    );
                    const isFocused = selectedIndex === folderIndex;
                    
                    return (
                      <Box key={folder.id} sx={{ mb: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            p: 0.5,
                            borderRadius: 1,
                            color: themeColors.text,
                            backgroundColor: isFocused ? themeColors.accent : 'transparent',
                            border: isFocused ? `2px solid ${themeColors.accent}` : '2px solid transparent',
                            '&:hover': !isFocused ? {
                              backgroundColor: themeColors.hover,
                              border: `2px solid ${themeColors.accent}`
                            } : {}
                          }}
                          onClick={() => toggleFolder(folder.id)}
                          onContextMenu={(e) => handleContextMenu(e, folder)}
                          aria-label={`Carpeta ${folder.name}, ${openFolders[folder.id] ? 'expandida' : 'colapsada'}, contiene ${folder.files?.length || 0} archivos`}
                          onMouseEnter={() => speakOnHover(`Carpeta ${folder.name}, ${openFolders[folder.id] ? 'expandida' : 'colapsada'}, contiene ${folder.files?.length || 0} archivos`)}
                          onMouseLeave={cancelHoverSpeak}
                          tabIndex={0}
                        >
                          {openFolders[folder.id] ? (
                            <ExpandLessIcon sx={{ color: isFocused ? themeColors.background : themeColors.accent }} />
                          ) : (
                            <ExpandMoreIcon sx={{ color: isFocused ? themeColors.background : themeColors.accent }} />
                          )}
                          <Folder sx={{ mr: 1, color: isFocused ? themeColors.background : themeColors.accent }} />
                          <Typography variant="body2" sx={{ 
                            flex: 1, 
                            color: isFocused ? themeColors.background : themeColors.text,
                            fontWeight: isFocused ? 600 : 400
                          }}>
                            {folder.name}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContextMenu(e, folder);
                            }}
                            aria-label="Más opciones"
                            sx={{ color: isFocused ? themeColors.background : themeColors.text }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Collapse in={openFolders[folder.id]}>
                          <Box sx={{ ml: 2 }}>
                            {(folder.files || []).filter(file => file && file.id && file.name).map((file) => {
                              const fileElements = getNavigableElements();
                              const fileIndex = fileElements.findIndex(el => 
                                el && el.type === 'file' && el.id === file.id && el.parentFolder === folder.id
                              );
                              const isFileSelected = selectedIndex === fileIndex;
                              const isCurrentChildFile = currentFileId === file.id;
                              
                              return (
                                <Box
                                  key={file.id}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    p: 0.5,
                                    borderRadius: 1,
                                    color: themeColors.text,
                                    backgroundColor: isFileSelected 
                                      ? themeColors.accent 
                                      : isCurrentChildFile 
                                        ? themeColors.hover 
                                        : 'transparent',
                                    border: (isFileSelected || isCurrentChildFile) ? `2px solid ${themeColors.accent}` : '2px solid transparent',
                                    '&:hover': !(isFileSelected || isCurrentChildFile) ? {
                                      backgroundColor: themeColors.hover
                                    } : {}
                                  }}
                                  onClick={() => handleFileClick(file)}
                                  onContextMenu={(e) => handleContextMenu(e, { ...file, parentFolder: folder.id })}
                                  aria-label={`Archivo ${file.name}${isCurrentChildFile ? ', actualmente abierto' : ''}`}
                                  onMouseEnter={() => speakOnHover(`Archivo ${file.name}${isCurrentChildFile ? ', actualmente abierto' : ''}`)}
                                  onMouseLeave={cancelHoverSpeak}
                                >
                                  <InsertDriveFile sx={{ 
                                    mr: 1, 
                                    fontSize: 16, 
                                    color: isFileSelected 
                                      ? themeColors.background 
                                      : isCurrentChildFile 
                                        ? themeColors.accent 
                                        : themeColors.info 
                                  }} />
                                  <Typography variant="caption" sx={{ 
                                    flex: 1,
                                    color: isFileSelected ? themeColors.background : themeColors.text,
                                    fontWeight: (isFileSelected || isCurrentChildFile) ? 600 : 400
                                  }}>
                                    {file.name}
                                  </Typography>
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleContextMenu(e, { ...file, parentFolder: folder.id });
                                    }}
                                    aria-label="Más opciones"
                                    sx={{ color: isFileSelected ? themeColors.background : themeColors.text }}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              );
                            })}
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })}

                  {/* Renderizar archivos sin carpeta */}
                  {files.filter(file => file && file.id && file.name).map((file) => {
                    const elements = getNavigableElements('files');
                    const fileIndex = elements.findIndex(el => el && el.type === 'file' && el.id === file.id && !el.parentFolder);
                    const isSelected = selectedIndex === fileIndex;
                    const isCurrentFile = currentFileId === file.id;
                    
                    return (
                      <Box
                        key={file.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          p: 0.5,
                          mb: 0.5,
                          borderRadius: 1,
                          color: themeColors.text,
                          backgroundColor: isSelected 
                            ? themeColors.accent 
                            : isCurrentFile
                              ? themeColors.hover 
                              : 'transparent',
                          border: (isSelected || isCurrentFile) ? `2px solid ${themeColors.accent}` : '2px solid transparent',
                          '&:hover': !(isSelected || isCurrentFile) ? {
                            backgroundColor: themeColors.hover,
                            border: `2px solid ${themeColors.accent}`
                          } : {}
                        }}
                        onClick={() => handleFileClick(file)}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        aria-label={`Archivo ${file.name}${isCurrentFile ? ', actualmente abierto' : ''}`}
                        onMouseEnter={() => speakOnHover(`Archivo ${file.name}${isCurrentFile ? ', actualmente abierto' : ''}`)}
                        onMouseLeave={cancelHoverSpeak}
                        tabIndex={0}
                      >
                        <InsertDriveFile sx={{ 
                          mr: 1, 
                          color: isSelected 
                            ? themeColors.background 
                            : isCurrentFile
                              ? themeColors.accent 
                              : themeColors.info 
                        }} />
                        <Typography variant="body2" sx={{ 
                          flex: 1, 
                          color: isSelected ? themeColors.background : themeColors.text,
                          fontWeight: (isSelected || isCurrentFile) ? 600 : 400
                        }}>
                          {file.name}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContextMenu(e, file);
                          }}
                          aria-label="Más opciones"
                          sx={{ color: isSelected ? themeColors.background : themeColors.text }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Box>



                  </Box>

                  {/* Panel inferior: Estructura del código - similar ajuste con highlight */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                    borderTop: `1px solid ${themeColors.border}`,
                    height: '100%',
                    backgroundColor: themeColors.background
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: 1,
                      borderBottom: isCodeStructureOpen ? `1px solid ${themeColors.border}` : 0,
                      cursor: 'pointer',
                      backgroundColor: themeColors.surface,
                      flexShrink: 0
                    }}
                    tabIndex={0}
                    onClick={() => setIsCodeStructureOpen(!isCodeStructureOpen)}
                    onFocus={() => speakOnFocus(`Estructura del código con ${codeStructure.length} elementos, actualmente ${isCodeStructureOpen ? 'expandida' : 'colapsada'}`)}
                    aria-label={`Estructura del código con ${codeStructure.length} elementos, ${isCodeStructureOpen ? 'expandida' : 'colapsada'}`}
                    onMouseEnter={() => speakOnHover(`Estructura del código con ${codeStructure.length} elementos, actualmente ${isCodeStructureOpen ? 'expandida' : 'colapsada'}. Click para ${isCodeStructureOpen ? 'colapsar' : 'expandir'}`)}
                    onMouseLeave={cancelHoverSpeak}
                    >
                      <Typography variant="body2" sx={{ flex: 1, fontWeight: 'medium', color: themeColors.text }}>
                        Estructura del Código ({codeStructure.length} elementos)
                      </Typography>
                      <IconButton 
                        size="small"
                        aria-label="Alternar estructura del código"
                        sx={{ color: themeColors.text }}
                      >
                        {isCodeStructureOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                    
                    <Box sx={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      minHeight: 0,
                      display: isCodeStructureOpen ? 'block' : 'none'
                    }}>
                      <List dense sx={{ p: 0 }}>
                        {codeStructure.map((item, index) => {
                          const isFocused = selectedIndex === index;
                          
                          return (
                            <ListItem
                              key={index}
                              tabIndex={0}
                              sx={{
                                borderBottom: `1px solid ${themeColors.border}`,
                                py: 1,
                                px: 1.5,
                                backgroundColor: isFocused ? themeColors.accent : 'transparent',
                                '&:hover': {
                                  backgroundColor: themeColors.hover
                                }
                              }}
                              onFocus={() => speakOnFocus(`${item.type} ${item.name ? item.name : 'sin nombre'}, líneas ${item.line} a ${item.end_line}`)}
                              aria-label={`${item.type} ${item.name ? item.name : 'sin nombre'}, desde línea ${item.line} hasta línea ${item.end_line}`}
                              onMouseEnter={() => speakOnHover(`${item.type} ${item.name ? item.name : 'sin nombre'}, desde línea ${item.line} hasta línea ${item.end_line}`)}
                              onMouseLeave={cancelHoverSpeak}
                            >
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      display: 'block',
                                      wordBreak: 'break-word',
                                      fontWeight: 'medium',
                                      color: isFocused ? themeColors.background : themeColors.text
                                    }}
                                  >
                                    <span style={{ 
                                      color: isFocused ? themeColors.background : themeColors.accent,
                                      fontWeight: 'bold'
                                    }}>
                                      {item.type}
                                    </span>
                                    {item.name && (
                                      <span style={{ marginLeft: '8px' }}>
                                        {item.name}
                                      </span>
                                    )}
                                  </Typography>
                                }
                                secondary={
                                  <Typography
                                    variant="caption"
                                    sx={{ 
                                      color: isFocused ? themeColors.background : themeColors.textSecondary,
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    Líneas {item.line}-{item.end_line}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  </Box>
                </Split>
              ) : (
                // Vista sin estructura (similar con highlights)
                // sin split...
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  minHeight: 0,
                  overflow: 'hidden',
                  p: 1,
                  flex: 1,
                  backgroundColor: themeColors.background
                }}>
                  {/* Información de almacenamiento */}
                  <Box sx={{ 
                    mb: 1,
                    p: 1,
                    backgroundColor: themeColors.surface,
                    borderRadius: 1,
                    border: `1px solid ${themeColors.border}`
                  }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: themeColors.textSecondary,
                        display: 'block'
                      }}
                      aria-live="polite"
                    >
                      Archivos: {files.length + folders.reduce((acc, f) => acc + f.files.length, 0)}/{MAX_FILES} | 
                      Carpetas: {folders.length}/{MAX_FOLDERS}
                    </Typography>
                  </Box>

                  {/* Botones de acción */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 1, 
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Crear nuevo archivo">
                        <Button
                          onClick={handleCreateFile}
                          onFocus={() => speakOnFocus('Botón: Crear nuevo archivo de texto')}
                          size="small"
                          variant="outlined"
                          fullWidth
                          aria-label="Crear nuevo archivo de texto"
                          onMouseEnter={() => speakOnHover('Botón: Crear nuevo archivo de texto')}
                          onMouseLeave={cancelHoverSpeak}
                          sx={{ 
                            color: themeColors.text,
                            borderColor: themeColors.border,
                            backgroundColor: selectedIndex === 0 ? themeColors.hover : 'transparent',
                            '&:hover': {
                              backgroundColor: themeColors.hover,
                              borderColor: themeColors.accent
                            }
                          }}
                        >
                          Nuevo Archivo
                        </Button>
                      </Tooltip>
                      <Tooltip title="Crear nueva carpeta">
                        <Button
                          onClick={handleCreateFolder}
                          onFocus={() => speakOnFocus('Botón: Crear nueva carpeta')}
                          size="small"
                          variant="outlined"
                          fullWidth
                          aria-label="Crear nueva carpeta"
                          onMouseEnter={() => speakOnHover('Botón: Crear nueva carpeta')}
                          onMouseLeave={cancelHoverSpeak}
                          sx={{ 
                            color: themeColors.text,
                            borderColor: themeColors.border,
                            backgroundColor: selectedIndex === 1 ? themeColors.hover : 'transparent',
                            '&:hover': {
                              backgroundColor: themeColors.hover,
                              borderColor: themeColors.accent
                            }
                          }}
                        >
                          Nueva Carpeta
                        </Button>
                      </Tooltip>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Abrir archivo desde el sistema">
                        <Button
                          onClick={handleOpenFile}
                          onFocus={() => speakOnFocus('Botón: Abrir archivo desde el sistema. Solo archivos Python y texto')}
                          size="small"
                          variant="outlined"
                          fullWidth
                          aria-label="Abrir archivo desde el sistema"
                          onMouseEnter={() => speakOnHover('Botón: Abrir archivo desde el sistema. Solo archivos Python y texto')}
                          onMouseLeave={cancelHoverSpeak}
                          sx={{ 
                            color: themeColors.text,
                            borderColor: themeColors.border,
                            backgroundColor: selectedIndex === 2 ? themeColors.hover : 'transparent',
                            '&:hover': {
                              backgroundColor: themeColors.hover,
                              borderColor: themeColors.accent
                            }
                          }}
                        >
                          Abrir Archivo
                        </Button>
                      </Tooltip>
                      <Tooltip title="Abrir carpeta desde el sistema">
                        <Button
                          onClick={handleOpenFolder}
                          onFocus={() => speakOnFocus('Botón: Abrir carpeta desde el sistema. Solo archivos Python y texto')}
                          size="small"
                          variant="outlined"
                          fullWidth
                          aria-label="Abrir carpeta desde el sistema"
                          onMouseEnter={() => speakOnHover('Botón: Abrir carpeta desde el sistema. Solo archivos Python y texto')}
                          onMouseLeave={cancelHoverSpeak}
                          sx={{ 
                            color: themeColors.text,
                            borderColor: themeColors.border,
                            backgroundColor: selectedIndex === 3 ? themeColors.hover : 'transparent',
                            '&:hover': {
                              backgroundColor: themeColors.hover,
                              borderColor: themeColors.accent
                            }
                          }}
                        >
                          Abrir Carpeta
                        </Button>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Lista de archivos */}
                  <Box sx={{ 
                    flex: 1,
                    overflowY: 'auto',
                    minHeight: 0
                  }}>
                    {files.length === 0 && folders.length === 0 && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textAlign: 'center', 
                          py: 2,
                          color: themeColors.textSecondary,
                          fontStyle: 'italic'
                        }}
                      >
                        No hay archivos abiertos. Usa los botones de arriba para crear o abrir archivos.
                      </Typography>
                    )}

                    {/* Renderizar carpetas y archivos */}
                    {getNavigableElements().map((element, index) => {
                      const isFocused = selectedIndex === index;
                      const isCurrentFile = element.type === 'file' && currentFileId === element.id;
                      
                      if (element.type === 'folder') {
                        return (
                          <Box key={element.id} sx={{ mb: 1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                p: 0.5,
                                borderRadius: 1,
                                color: themeColors.text,
                                backgroundColor: isFocused 
                                  ? themeColors.accent 
                                  : 'transparent',
                                border: isFocused ? `2px solid ${themeColors.accent}` : '2px solid transparent',
                                '&:hover': !isFocused ? {
                                  backgroundColor: themeColors.hover
                                } : {}
                              }}
                              onClick={() => toggleFolder(element.id)}
                              onContextMenu={(e) => handleContextMenu(e, element)}
                              aria-label={`Carpeta ${element.name}, ${openFolders[element.id] ? 'expandida' : 'colapsada'}, contiene ${element.files.length} archivos`}
                              onMouseEnter={() => !isFocused && speakOnHover(`Carpeta ${element.name}, ${openFolders[element.id] ? 'expandida' : 'colapsada'}, contiene ${element.files.length} archivos`)}
                              onMouseLeave={cancelHoverSpeak}
                            >
                              {openFolders[element.id] ? (
                                <ExpandLessIcon sx={{ color: isFocused ? themeColors.background : themeColors.accent }} />
                              ) : (
                                <ExpandMoreIcon sx={{ color: isFocused ? themeColors.background : themeColors.accent }} />
                              )}
                              <Folder sx={{ 
                                mr: 1, 
                                color: isFocused 
                                  ? themeColors.background 
                                  : themeColors.accent 
                              }} />
                              <Typography variant="body2" sx={{ 
                                flex: 1, 
                                color: isFocused ? themeColors.background : themeColors.text,
                                fontWeight: isFocused ? 600 : 400
                              }}>
                                {element.name}
                              </Typography>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContextMenu(e, element);
                                }}
                                onFocus={() => speakOnFocus(`Opciones para carpeta ${element.name}`)}
                                onMouseEnter={() => speakOnHover(`Opciones para carpeta ${element.name}`)}
                                onMouseLeave={cancelHoverSpeak}
                                aria-label="Más opciones"
                                sx={{ color: isFocused ? themeColors.background : themeColors.text }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Collapse in={openFolders[element.id]}>
                              <Box sx={{ ml: 2 }}>
                                {element.files.map((file) => {
                                  // CORRECCIÓN: Buscar el índice del archivo en getNavigableElements
                                  const fileElements = getNavigableElements();
                                  const fileIndex = fileElements.findIndex(el => 
                                    el.type === 'file' && el.id === file.id && el.parentFolder === element.id
                                  );
                                  const isFileFocused = selectedIndex === fileIndex;
                                  const isCurrentChildFile = currentFileId === file.id;
                                  
                                  return (
                                    <Box
                                      key={file.id}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        p: 0.5,
                                        borderRadius: 1,
                                        color: themeColors.text,
                                        backgroundColor: isFileFocused 
                                          ? themeColors.accent 
                                          : isCurrentChildFile 
                                            ? themeColors.hover 
                                            : 'transparent',
                                        border: (isFileFocused || isCurrentChildFile) ? `2px solid ${themeColors.accent}` : '2px solid transparent',
                                        '&:hover': !(isFileFocused || isCurrentChildFile) ? {
                                          backgroundColor: themeColors.hover
                                        } : {}
                                      }}
                                      onClick={() => handleFileClick(file)}
                                      onContextMenu={(e) => handleContextMenu(e, { ...file, parentFolder: element.id })}
                                      aria-label={`Archivo ${file.name}${isCurrentChildFile ? ', actualmente abierto' : ''}`}
                                      onMouseEnter={() => !(isFileFocused || isCurrentChildFile) && speakOnHover(`Archivo ${file.name}${isCurrentChildFile ? ', actualmente abierto' : ''}`)}
                                      onMouseLeave={cancelHoverSpeak}
                                    >
                                      <InsertDriveFile sx={{ 
                                        mr: 1, 
                                        fontSize: 16, 
                                        color: isFileFocused 
                                          ? themeColors.background 
                                          : isCurrentChildFile 
                                            ? themeColors.accent 
                                            : themeColors.info 
                                      }} />
                                      <Typography variant="caption" sx={{ 
                                        flex: 1, 
                                        color: isFileFocused ? themeColors.background : themeColors.text,
                                        fontWeight: (isFileFocused || isCurrentChildFile) ? 600 : 400 
                                      }}>
                                        {file.name}
                                      </Typography>
                                      <IconButton 
                                        size="small" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleContextMenu(e, { ...file, parentFolder: element.id });
                                        }}
                                        onFocus={() => speakOnFocus(`Opciones para archivo ${file.name}`)}
                                        onMouseEnter={() => speakOnHover(`Opciones para archivo ${file.name}`)}
                                        onMouseLeave={cancelHoverSpeak}
                                        aria-label="Más opciones"
                                        sx={{ color: isFileFocused ? themeColors.background : themeColors.text }}
                                      >
                                        <MoreVertIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      } else {
                        return (
                          <Box
                            key={element.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              p: 0.5,
                              mb: 0.5,
                              borderRadius: 1,
                              color: themeColors.text,
                              backgroundColor: isFocused 
                                ? themeColors.accent 
                                : isCurrentFile
                                  ? themeColors.hover 
                                  : 'transparent',
                              border: (isFocused || isCurrentFile) ? `2px solid ${themeColors.accent}` : '2px solid transparent',
                              '&:hover': !(isFocused || isCurrentFile) ? {
                                backgroundColor: themeColors.hover
                              } : {}
                            }}
                            onClick={() => handleFileClick(element)}
                            onContextMenu={(e) => handleContextMenu(e, element)}
                            aria-label={`Archivo ${element.name}${isCurrentFile ? ', actualmente abierto' : ''}`}
                            onMouseEnter={() => !(isFocused || isCurrentFile) && speakOnHover(`Archivo ${element.name}${isCurrentFile ? ', actualmente abierto' : ''}`)}
                            onMouseLeave={cancelHoverSpeak}
                          >
                            <InsertDriveFile sx={{ 
                              mr: 1, 
                              color: isFocused 
                                ? themeColors.background 
                                : isCurrentFile
                                  ? themeColors.accent 
                                  : themeColors.info 
                            }} />
                            <Typography variant="body2" sx={{ 
                              flex: 1, 
                              color: isFocused ? themeColors.background : themeColors.text,
                              fontWeight: (isFocused || isCurrentFile) ? 600 : 400
                            }}>
                              {element.name}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, element);
                              }}
                              onFocus={() => speakOnFocus(`Opciones para archivo ${element.name}`)}
                              onMouseEnter={() => speakOnHover(`Opciones para archivo ${element.name}`)}
                              onMouseLeave={cancelHoverSpeak}
                              aria-label="Más opciones"
                              sx={{ color: isFocused ? themeColors.background : themeColors.text }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        );
                      }
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Menú contextual */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            border: `1px solid ${themeColors.border}`
          }
        }}
      >
        {/* Opción Abrir para archivos */}
        {selectedItem?.type === 'file' && (
          <MenuItem 
            onClick={() => {
              handleFileClick(selectedItem);
              handleCloseContextMenu();
            }}
            aria-label="Abrir archivo"
            onFocus={() => speakOnFocus('Abrir archivo en el editor')}
            onMouseEnter={() => speakOnHover('Abrir archivo en el editor')}
            onMouseLeave={cancelHoverSpeak}
          >
            {/* <FolderOpenIcon sx={{ mr: 1, fontSize: 18 }} /> */}
            Abrir
          </MenuItem>
        )}

        {/* Opción Guardar solo si es el archivo actual */}
        {/* {selectedItem?.type === 'file' && currentFileId === selectedItem.id && ( */}
          <MenuItem 
            onClick={handleSaveCurrentFile}
            aria-label="Guardar archivo (Alt+S)"
            onFocus={() => speakOnFocus('Guardar archivo actual. También puedes usar Alt más S')}
            onMouseEnter={() => speakOnHover('Guardar archivo. También puedes usar Alt más S')}
            onMouseLeave={cancelHoverSpeak}
          >
            
            Guardar <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>(Alt+S)</Typography>
          </MenuItem>
        

        {/* Opción Abrir para carpetas */}
        {selectedItem?.type === 'folder' && (
          <MenuItem 
            onClick={() => {
              toggleFolder(selectedItem.id);
              handleCloseContextMenu();
            }}
            aria-label="Expandir/colapsar carpeta"
            onFocus={() => speakOnFocus('Expandir o colapsar carpeta seleccionada')}
            onMouseEnter={() => speakOnHover('Expandir o colapsar carpeta')}
            onMouseLeave={cancelHoverSpeak}
          >
            {/* <FolderOpenIcon sx={{ mr: 1, fontSize: 18 }} /> */}
            {openFolders[selectedItem.id] ? 'Colapsar' : 'Expandir'}
          </MenuItem>
        )}

        {/* Crear archivo dentro de carpeta */}
        {selectedItem?.type === 'folder' && (
          <MenuItem 
            onClick={handleCreateFileInFolder}
            aria-label="Crear archivo dentro de esta carpeta"
            onFocus={() => speakOnFocus('Crear un nuevo archivo dentro de esta carpeta')}
            onMouseEnter={() => speakOnHover('Crear un nuevo archivo dentro de esta carpeta')}
            onMouseLeave={cancelHoverSpeak}
          >
            Crear archivo aquí
          </MenuItem>
        )}

        <MenuItem 
          onClick={handleRename}
          aria-label="Renombrar"
          onFocus={() => speakOnFocus('Renombrar archivo o carpeta seleccionada')}
          onMouseEnter={() => speakOnHover('Renombrar')}
          onMouseLeave={cancelHoverSpeak}
        >
          {/* <EditIcon sx={{ mr: 1, fontSize: 18 }} /> */}
          Renombrar
        </MenuItem>
        
        <MenuItem 
          onClick={handleDelete}
          aria-label="Eliminar"
          onFocus={() => speakOnFocus('Eliminar archivo o carpeta seleccionada')}
          onMouseEnter={() => speakOnHover('Eliminar')}
          onMouseLeave={cancelHoverSpeak}
        >
          {/* <DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> */}
          Eliminar
        </MenuItem>
        
        {selectedItem?.type === 'file' && (
          <MenuItem 
            onClick={handleDownload}
            aria-label="Descargar"
            onFocus={() => speakOnFocus('Descargar archivo a tu computadora')}
            onMouseEnter={() => speakOnHover('Descargar archivo a tu computadora')}
            onMouseLeave={cancelHoverSpeak}
          >
            {/* <DownloadIcon sx={{ mr: 1, fontSize: 18 }} /> */}
            Descargar
          </MenuItem>
        )}
      </Menu>

      {/* Dialog para crear */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => {
          stop();
          setDialogOpen(false);
          setNewName('');
          speak('Diálogo cerrado');
        }}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        disableRestoreFocus
        PaperProps={{
          sx: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            border: `1px solid ${themeColors.border}`
          }
        }}
      >
        <DialogTitle 
          id="dialog-title" 
          sx={{ color: themeColors.text }}
          tabIndex={-1}
        >
          {isFile ? 'Crear Nuevo Archivo' : 'Crear Nueva Carpeta'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText 
            id="dialog-description"
            sx={{ color: themeColors.textSecondary, mb: 1 }}
            tabIndex={-1}
          >
            {isFile 
              ? 'Ingresa el nombre para el archivo. Solo se permiten extensiones .txt o .py. Si no escribes extensión, se usará .txt por defecto.'
              : 'Ingresa el nombre para la carpeta:'
            }
          </DialogContentText>
          <TextField
            inputRef={createDialogInputRef}
            margin="dense"
            label="Nombre"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={handleCreateDialogChange}
            onKeyDown={(e) => {
              handleCreateDialogKeyDown(e);
              if (e.key === 'Enter') {
                e.preventDefault();
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                handleDialogConfirm();
              }
            }}
            onFocus={() => {
              const dialogType = isFile ? 'archivo' : 'carpeta';
              const extensionInfo = isFile ? '. Solo se permiten extensiones .txt o .py' : '';
              speakOnFocus(`Campo de nombre para ${dialogType}. ${newName ? `Nombre actual: ${newName}` : 'Campo vacío'}. Escribe el nombre y presiona Enter para crear${extensionInfo}`);
            }}
            onBlur={() => {
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
            }}
            aria-label={`Nombre del ${isFile ? 'archivo' : 'carpeta'}`}
            aria-describedby="dialog-description"
            placeholder={isFile ? "ejemplo.py o ejemplo.txt" : "Nombre de la carpeta"}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: themeColors.text,
                '& fieldset': {
                  borderColor: themeColors.border
                },
                '&:hover fieldset': {
                  borderColor: themeColors.accent
                },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.accent
                }
              },
              '& .MuiInputLabel-root': {
                color: themeColors.textSecondary,
                '&.Mui-focused': {
                  color: themeColors.accent
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              stop();
              setDialogOpen(false);
              setNewName('');
              speak('Diálogo cancelado');
            }}
            onFocus={() => speakOnFocus('Botón cancelar. Presiona Enter para cerrar el diálogo sin crear')}
            onMouseEnter={() => speakOnHover('Cancelar')}
            onMouseLeave={cancelHoverSpeak}
            sx={{ color: themeColors.textSecondary }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              handleDialogConfirm();
            }}
            onFocus={() => speakOnFocus(`Botón crear ${isFile ? 'archivo' : 'carpeta'}. Presiona Enter para confirmar`)}
            onMouseEnter={() => speakOnHover('Crear')}
            onMouseLeave={cancelHoverSpeak}
            variant="contained"
            disabled={!newName.trim()}
            sx={{
              backgroundColor: themeColors.accent,
              color: themeColors.background,
              '&:hover': {
                backgroundColor: themeColors.accent,
                filter: 'brightness(0.9)'
              },
              '&.Mui-disabled': {
                backgroundColor: themeColors.textSecondary,
                opacity: 0.5
              }
            }}
          >
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para renombrar */}
      <Dialog 
        open={renameDialogOpen} 
        onClose={() => {
          stop();
          setRenameDialogOpen(false);
          setNewName('');
          speak('Diálogo cerrado');
        }}
        aria-labelledby="rename-dialog-title"
        aria-describedby="rename-dialog-description"
        disableRestoreFocus
        PaperProps={{
          sx: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            border: `1px solid ${themeColors.border}`
          }
        }}
      >
        <DialogTitle 
          id="rename-dialog-title" 
          sx={{ color: themeColors.text }}
          tabIndex={-1}
        >
          Renombrar {selectedItem?.type === 'folder' ? 'Carpeta' : 'Archivo'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText 
            id="rename-dialog-description"
            sx={{ color: themeColors.textSecondary, mb: 1 }}
            tabIndex={-1}
          >
            Nombre actual: <strong>{selectedItem?.name}</strong>
          </DialogContentText>
          <TextField
            inputRef={renameDialogInputRef}
            margin="dense"
            label="Nuevo nombre"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={handleRenameDialogChange}
            onKeyDown={(e) => {
              handleRenameDialogKeyDown(e);
              if (e.key === 'Enter') {
                e.preventDefault();
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                confirmRename();
              }
            }}
            onFocus={() => {
              speakOnFocus(`Campo de nuevo nombre. Nombre actual: ${newName}. Escribe el nuevo nombre y presiona Enter para confirmar`);
            }}
            onBlur={() => {
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
            }}
            aria-label="Nuevo nombre"
            aria-describedby="rename-dialog-description"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: themeColors.text,
                '& fieldset': {
                  borderColor: themeColors.border
                },
                '&:hover fieldset': {
                  borderColor: themeColors.accent
                },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.accent
                }
              },
              '& .MuiInputLabel-root': {
                color: themeColors.textSecondary,
                '&.Mui-focused': {
                  color: themeColors.accent
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              stop();
              setRenameDialogOpen(false);
              setNewName('');
              speak('Diálogo cancelado');
            }}
            onFocus={() => speakOnFocus('Botón cancelar. Presiona Enter para cerrar sin renombrar')}
            onMouseEnter={() => speakOnHover('Cancelar')}
            onMouseLeave={cancelHoverSpeak}
            sx={{ color: themeColors.textSecondary }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              confirmRename();
            }}
            onFocus={() => speakOnFocus('Botón renombrar. Presiona Enter para confirmar el nuevo nombre')}
            onMouseEnter={() => speakOnHover('Renombrar')}
            onMouseLeave={cancelHoverSpeak}
            variant="contained"
            disabled={!newName.trim()}
            sx={{
              backgroundColor: themeColors.accent,
              color: themeColors.background,
              '&:hover': {
                backgroundColor: themeColors.accent,
                filter: 'brightness(0.9)'
              },
              '&.Mui-disabled': {
                backgroundColor: themeColors.textSecondary,
                opacity: 0.5
              }
            }}
          >
            Renombrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => {
          stop();
          setDeleteDialogOpen(false);
          speak('Diálogo cerrado');
        }}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        disableRestoreFocus
        PaperProps={{
          sx: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            border: `1px solid ${themeColors.border}`
          }
        }}
      >
        <DialogTitle 
          id="delete-dialog-title" 
          sx={{ color: themeColors.text }}
          tabIndex={-1}
        >
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText 
            id="delete-dialog-description"
            sx={{ color: themeColors.textSecondary }}
            tabIndex={-1}
          >
            ¿Estás seguro de que deseas eliminar {selectedItem?.type === 'folder' ? 'la carpeta' : 'el archivo'} "<strong>{selectedItem?.name}</strong>"?
            {selectedItem?.type === 'folder' && ' Esto eliminará todos los archivos dentro de la carpeta.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              stop();
              setDeleteDialogOpen(false);
              speak('Eliminación cancelada');
            }}
            onFocus={() => speakOnFocus('Botón cancelar. Presiona Enter para cerrar sin eliminar')}
            onMouseEnter={() => speakOnHover('Cancelar')}
            onMouseLeave={cancelHoverSpeak}
            autoFocus
            sx={{ color: themeColors.textSecondary }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              confirmDelete();
            }}
            onFocus={() => speakOnFocus(`Botón eliminar ${selectedItem?.type === 'folder' ? 'carpeta' : 'archivo'}. Presiona Enter para confirmar la eliminación. Esta acción no se puede deshacer`)}
            onMouseEnter={() => speakOnHover('Eliminar')}
            onMouseLeave={cancelHoverSpeak}
            variant="contained" 
            sx={{ 
              backgroundColor: themeColors.error,
              '&:hover': {
                backgroundColor: themeColors.error,
                filter: 'brightness(0.9)'
              }
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de advertencia de almacenamiento */}
      <Dialog 
        open={storageWarningOpen} 
        onClose={() => {
          stop();
          setStorageWarningOpen(false);
          speak('Advertencia cerrada');
        }}
        aria-labelledby="storage-warning-title"
        aria-describedby="storage-warning-description"
        disableRestoreFocus
        PaperProps={{
          sx: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            border: `2px solid ${themeColors.warning}`
          }
        }}
      >
        <DialogTitle 
          id="storage-warning-title" 
          sx={{ color: themeColors.warning, display: 'flex', alignItems: 'center' }}
          tabIndex={-1}
        >
          <WarningIcon sx={{ mr: 1 }} />
          Límite de Almacenamiento
        </DialogTitle>
        <DialogContent>
          <DialogContentText 
            id="storage-warning-description"
            sx={{ color: themeColors.text }}
            tabIndex={-1}
          >
            {storageWarningMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              stop();
              setStorageWarningOpen(false);
              speak('Advertencia cerrada');
            }}
            onFocus={() => speakOnFocus('Botón entendido. Presiona Enter para cerrar la advertencia')}
            onMouseEnter={() => speakOnHover('Entendido')}
            onMouseLeave={cancelHoverSpeak}
            variant="contained"
            autoFocus
            sx={{ 
              backgroundColor: themeColors.accent,
              '&:hover': {
                backgroundColor: themeColors.accent,
                filter: 'brightness(0.9)'
              }
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de error de extensión */}
      <Dialog 
        open={extensionErrorOpen} 
        onClose={() => {
          stop();
          setExtensionErrorOpen(false);
          speak('Mensaje cerrado');
        }}
        aria-labelledby="extension-error-title"
        aria-describedby="extension-error-description"
        disableRestoreFocus
        PaperProps={{
          sx: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            border: `2px solid ${themeColors.error || '#d32f2f'}`
          }
        }}
      >
        <DialogTitle 
          id="extension-error-title" 
          sx={{ color: themeColors.error || '#d32f2f', display: 'flex', alignItems: 'center' }}
          tabIndex={-1}
        >
          <WarningIcon sx={{ mr: 1 }} />
          Extensión no permitida
        </DialogTitle>
        <DialogContent>
          <DialogContentText 
            id="extension-error-description"
            sx={{ color: themeColors.text }}
            tabIndex={-1}
          >
            Solo se permiten archivos con extensión <strong>.txt</strong> (texto) o <strong>.py</strong> (Python).
            Por favor, usa una de estas extensiones.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              stop();
              setExtensionErrorOpen(false);
              speak('Mensaje cerrado');
              // Volver a enfocar el input correspondiente
              setTimeout(() => {
                if (dialogOpen && createDialogInputRef.current) {
                  createDialogInputRef.current.focus();
                } else if (renameDialogOpen && renameDialogInputRef.current) {
                  renameDialogInputRef.current.focus();
                }
              }, 100);
            }}
            onFocus={() => speakOnFocus('Botón entendido. Presiona Enter para cerrar y corregir el nombre')}
            onMouseEnter={() => speakOnHover('Entendido')}
            onMouseLeave={cancelHoverSpeak}
            variant="contained"
            autoFocus
            sx={{ 
              backgroundColor: themeColors.accent,
              color: themeColors.background,
              '&:hover': {
                backgroundColor: themeColors.accent,
                filter: 'brightness(0.9)'
              }
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default FileManager;