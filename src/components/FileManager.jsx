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
  const [isKeyboardNavigation, setIsKeyboardNavigation] = React.useState(false);
  const [focusedCodeButton, setFocusedCodeButton] = React.useState(null);
  const chatContainerRef = React.useRef(null);
  const messageRefs = React.useRef({});
  const inputRef = React.useRef(null);
  // Verificar si hay contenido en la estructura del código
  const hasCodeStructure = codeStructure && codeStructure.length > 0;
  const [lastTypedWord, setLastTypedWord] = React.useState('');
  const typingTimeoutRef = React.useRef(null);
  const [focusedSection, setFocusedSection] = React.useState('files'); 
  const fileManagerRef = React.useRef(null);
  const lastMessageRef = React.useRef(null);
  const { enabled, speak, speakOnHover, speakOnFocus, cancelHoverSpeak, announce, stop } = useScreenReader();
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToModify, setItemToModify] = React.useState(null);
  const [storageWarningOpen, setStorageWarningOpen] = React.useState(false);
  const [storageWarningMessage, setStorageWarningMessage] = React.useState('');
  const { registerComponent, unregisterComponent, setFocusedComponent } = useAppNavigation();
  const fileManagerContainerRef = React.useRef(null);
  const [isFileManagerFocused, setIsFileManagerFocused] = React.useState(false);
  // const [selectedIndex, setFocusedIndex] = React.useState(0);
  // const [selectedElement, setSelectedElement] = React.useState(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0)

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

  const themeColors = getThemeColors(contrast);

  // Calcular uso de almacenamiento
  const calculateStorageUsage = React.useCallback(() => {
    const filesSize = new Blob([JSON.stringify(files)]).size;
    const foldersSize = new Blob([JSON.stringify(folders)]).size;
    return filesSize + foldersSize;
  }, [files, folders]);

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
  // Función para abrir menú contextual
  const handleContextMenu = React.useCallback((event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
    setSelectedItem(item);
    
    const itemType = item.type === 'folder' ? 'carpeta' : 'archivo';
    const isCurrent = item.type === 'file' && currentFileId === item.id;
    const options = isCurrent 
      ? 'Abrir, Guardar, Renombrar, Eliminar, Descargar'
      : item.type === 'file' 
        ? 'Abrir, Renombrar, Eliminar, Descargar' 
        : 'Abrir, Renombrar, Eliminar';
    
    speak(`Menú contextual abierto para ${itemType} ${item.name}. Opciones: ${options}`);
  }, [speak, currentFileId]);

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

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
      // Verificar si es un archivo de carpeta o archivo raíz
      if (selectedItem.parentFolder) {
        setFolders(prev => prev.map(folder => {
          if (folder.id === selectedItem.parentFolder) {
            return {
              ...folder,
              files: folder.files.map(f => 
                f.id === itemId ? { ...f, name: newName } : f
              )
            };
          }
          return folder;
        }));
      } else {
        setFiles(prev => prev.map(f => 
          f.id === itemId ? { ...f, name: newName } : f
        ));
      }
      speak(`Archivo renombrado a ${newName}`);
    } else {
      setFolders(prev => prev.map(f => 
        f.id === itemId ? { ...f, name: newName } : f
      ));
      speak(`Carpeta renombrada a ${newName}`);
    }

    setRenameDialogOpen(false);
    setNewName('');
    setSelectedItem(null);
  }, [selectedItem, newName, speak]);

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

  // Scroll al mensaje enfocado
  React.useEffect(() => {
    if (focusedMessageIndex >= 0 && messageRefs.current[focusedMessageIndex] && isKeyboardNavigation) {
      messageRefs.current[focusedMessageIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [focusedMessageIndex, isKeyboardNavigation]);

  // Detener la lectura cuando el usuario cambia de posición
  React.useEffect(() => {
    const handleUserInteraction = () => {
      if (window.speechSynthesis.speaking) {
        stop();
      }
    };

    // Escuchar eventos de teclado y mouse que indiquen cambio de foco
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('click', handleUserInteraction);
    
    return () => {
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, [stop]);

  // Obtener elementos navegables según la sección actual
  const getNavigableElements = React.useCallback(() => {
  if (tabIndex === 1) {
    // En el chat, no hay navegación de elementos
    return [];
  }

  switch (focusedSection) {
    case 'buttons':
      return [
        { type: 'button', action: 'createFile' },
        { type: 'button', action: 'createFolder' },
        { type: 'button', action: 'openFile' },
        { type: 'button', action: 'openFolder' }
      ];
    
    case 'files':
      const elements = [];
      
      // Agregar carpetas
      folders.forEach(folder => {
        elements.push({ ...folder, type: 'folder' });
        // Si la carpeta está abierta, agregar sus archivos
        if (openFolders[folder.id]) {
          folder.files.forEach(file => {
            elements.push({ ...file, type: 'file', parentFolder: folder.id });
          });
        }
      });
      
      // Agregar archivos sin carpeta
      files.forEach(file => {
        elements.push({ ...file, type: 'file' });
      });
      
      return elements;
    
    case 'structure':
      return codeStructure || [];
    
    default:
      return [];
  }
}, [focusedSection, folders, files, codeStructure, openFolders, tabIndex]);

  // Obtener descripción del elemento enfocado
  const getFocusedElementDescription = React.useCallback(() => {
    const elements = getNavigableElements();
    
    if (tabIndex === 1) {
      return 'Chat con copiloto. Use las teclas Tab y Shift+Tab para navegar entre los controles';
    }

    if (focusedSection === 'buttons') {
      const buttonNames = {
        createFile: 'Botón: Crear nuevo archivo de texto',
        createFolder: 'Botón: Crear nueva carpeta',
        openFile: 'Botón: Abrir archivo desde el sistema',
        openFolder: 'Botón: Abrir carpeta desde el sistema'
      };
      return buttonNames[elements[selectedIndex]] || '';
    }

    if (focusedSection === 'files') {
      const element = elements[selectedIndex];
      if (!element) return '';
      
      if (element.type === 'folder') {
        const isOpen = openFolders[element.id];
        return `Carpeta ${element.name}, ${isOpen ? 'expandida' : 'colapsada'}, contiene ${element.files.length} archivos. Presione Enter para ${isOpen ? 'colapsar' : 'expandir'}. Presione M para abrir menú de opciones`;
      } else {
        const ext = element.name.split('.').pop().toLowerCase();
        const canOpen = ext === 'py' || ext === 'txt';
        return `Archivo ${element.name}. ${canOpen ? 'Presione Enter para abrir en el editor.' : 'Este archivo no puede ser abierto en el editor.'} Presione M para menú de opciones: renombrar, eliminar o descargar`;
      }
    }

    if (focusedSection === 'structure') {
      const element = elements[selectedIndex];
      if (!element) return '';
      return `${element.type} ${element.name || 'sin nombre'}, desde línea ${element.line} hasta línea ${element.end_line}`;
    }

    return '';
  }, [focusedSection, selectedIndex, getNavigableElements, openFolders, tabIndex]);

  // Manejar navegación por teclado
  const handleKeyDown = React.useCallback((e) => {
    if (collapsed || tabIndex === 1) return;

    const elements = getNavigableElements();
    const maxIndex = elements.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < maxIndex ? prev + 1 : 0;
          return newIndex;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : maxIndex;
          return newIndex;
        });
        break;

      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (focusedSection === 'files') {
            setFocusedSection('buttons');
            setSelectedIndex(0);
          } else if (focusedSection === 'structure' && hasCodeStructure) {
            setFocusedSection('files');
            setSelectedIndex(0);
          }
        } else {
          if (focusedSection === 'buttons') {
            setFocusedSection('files');
            setSelectedIndex(0);
          } else if (focusedSection === 'files' && hasCodeStructure) {
            setFocusedSection('structure');
            setSelectedIndex(0);
          }
        }
        break;

      case 'Enter':
        e.preventDefault();
        handleEnterPress();
        break;

      case 'm':
      case 'M':
        e.preventDefault();
        if (focusedSection === 'files' && elements[selectedIndex]) {
          const element = elements[selectedIndex];
          const fakeEvent = {
            preventDefault: () => {},
            stopPropagation: () => {},
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2
          };
          handleContextMenu(fakeEvent, element);
        }
        break;

      default:
        break;
    }
  }, [collapsed, focusedSection, selectedIndex, getNavigableElements, hasCodeStructure, tabIndex, handleContextMenu]);

  // Manejar Enter en el elemento enfocado
  const handleEnterPress = React.useCallback(() => {
    const elements = getNavigableElements();

    if (focusedSection === 'buttons') {
      const actions = {
        createFile: () => handleCreateFile(),
        createFolder: () => handleCreateFolder(),
        openFile: () => handleOpenFile(),
        openFolder: () => handleOpenFolder()
      };
      actions[elements[selectedIndex]]?.();
    }

    if (focusedSection === 'files') {
      const element = elements[selectedIndex];
      if (element?.type === 'folder') {
        toggleFolder(element.id);
      } else if (element?.type === 'file') {
        handleFileClick(element);
      }
    }
  }, [focusedSection, selectedIndex, getNavigableElements]);

  // Manejar navegación por teclado en el chat
  const handleChatKeyDown = React.useCallback((e) => {
    if (tabIndex !== 1) return;

    // Detectar si estamos en el input de texto
    const isInTextField = e.target.tagName === 'TEXTAREA' || 
                         (e.target.tagName === 'INPUT' && e.target.type === 'text');

    // Si estamos en el input, solo manejar Escape para salir
    if (isInTextField) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsKeyboardNavigation(true);
        if (chatHistory.length > 0) {
          setFocusedMessageIndex(chatHistory.length - 1);
          setFocusedCodeButton(null);
          const lastMessage = chatHistory[chatHistory.length - 1];
          const role = lastMessage.role === 'user' ? 'Tu mensaje' : 'Respuesta del copiloto';
          speakOnFocus(`Mensaje ${chatHistory.length} de ${chatHistory.length}. ${role}`);
        }
      }
      return; // No procesar otras teclas cuando estamos en el input
    }

    // Activar navegación por teclado en cualquier tecla de navegación
    if (['ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Escape', 'i', 'I'].includes(e.key)) {
      setIsKeyboardNavigation(true);
    }

    // Si no hay mensajes, no hacer nada
    if (chatHistory.length === 0 && !['i', 'I'].includes(e.key)) return;

    switch (e.key) {
      case 'i':
      case 'I':
        // Comando 'i' para ir al input (como en Vim)
        e.preventDefault();
        stop();
        setIsKeyboardNavigation(false);
        setFocusedMessageIndex(-1);
        setFocusedCodeButton(null);
        if (inputRef.current) {
          inputRef.current.focus();
          speakOnFocus('Campo de texto enfocado. Escribe tu pregunta');
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        stop();
        setFocusedCodeButton(null);
        setFocusedMessageIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : (prev === -1 ? chatHistory.length - 1 : 0);
          const message = chatHistory[newIndex];
          const role = message.role === 'user' ? 'Tu mensaje' : 'Respuesta del copiloto';
          speakOnFocus(`Mensaje ${newIndex + 1} de ${chatHistory.length}. ${role}`);
          return newIndex;
        });
        break;

      case 'ArrowDown':
        e.preventDefault();
        stop();
        setFocusedCodeButton(null);
        setFocusedMessageIndex(prev => {
          const newIndex = prev < chatHistory.length - 1 ? prev + 1 : (prev === -1 ? 0 : chatHistory.length - 1);
          const message = chatHistory[newIndex];
          const role = message.role === 'user' ? 'Tu mensaje' : 'Respuesta del copiloto';
          speakOnFocus(`Mensaje ${newIndex + 1} de ${chatHistory.length}. ${role}`);
          return newIndex;
        });
        break;

      case 'Tab':
        e.preventDefault();
        if (focusedMessageIndex >= 0) {
          // Buscar botones de código en el mensaje actual
          const messageCodeButtons = document.querySelectorAll(
            `[data-message-index="${focusedMessageIndex}"][data-copy-button]`
          );
          
          if (messageCodeButtons.length > 0) {
            if (focusedCodeButton === null) {
              // Primer botón del mensaje
              setFocusedCodeButton({ messageIndex: focusedMessageIndex, codeIndex: 0 });
              speakOnFocus('Botón copiar código Python. Presiona Enter para copiar');
            } else if (focusedCodeButton.codeIndex < messageCodeButtons.length - 1) {
              // Siguiente botón
              setFocusedCodeButton({ 
                messageIndex: focusedMessageIndex, 
                codeIndex: focusedCodeButton.codeIndex + 1 
              });
              speakOnFocus('Botón copiar código Python. Presiona Enter para copiar');
            } else {
              // Volver al mensaje
              setFocusedCodeButton(null);
              const message = chatHistory[focusedMessageIndex];
              const role = message.role === 'user' ? 'Tu mensaje' : 'Respuesta del copiloto';
              speakOnFocus(`Mensaje ${focusedMessageIndex + 1} de ${chatHistory.length}. ${role}`);
            }
          }
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedCodeButton !== null) {
          // Copiar código
          const button = document.querySelector(
            `[data-message-index="${focusedCodeButton.messageIndex}"][data-code-index="${focusedCodeButton.codeIndex}"]`
          );
          if (button) {
            button.click();
            speakOnFocus('Código copiado al portapapeles');
          }
        } else if (focusedMessageIndex >= 0) {
          // Leer el contenido completo del mensaje
          const message = chatHistory[focusedMessageIndex];
          const textContent = message.content
            .replace(/```[\s\S]*?```/g, '. Bloque de código. ')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/#{1,6}\s/g, '')
            .replace(/\n{2,}/g, '. ')
            .replace(/\n/g, ' ')
            .trim();
          
          stop();
          
          // Dividir el texto en chunks más pequeños para evitar timeouts
          const chunks = textContent.match(/[^.!?]+[.!?]+/g) || [textContent];
          
          let chunkIndex = 0;
          const speakNextChunk = () => {
            if (chunkIndex < chunks.length && window.speechSynthesis.speaking === false) {
              speak(chunks[chunkIndex], { rate: 1.1 });
              chunkIndex++;
              
              // Esperar a que termine y hablar el siguiente chunk
              setTimeout(() => {
                if (chunkIndex < chunks.length) {
                  speakNextChunk();
                }
              }, chunks[chunkIndex - 1].length * 50); // Ajustar delay según longitud
            }
          };
          
          speakNextChunk();
        }
        break;

      case 'Escape':
        e.preventDefault();
        stop();
        setFocusedCodeButton(null);
        speakOnFocus('Lectura detenida');
        break;

      default:
        break;
    }
  }, [tabIndex, chatHistory, focusedMessageIndex, focusedCodeButton, speakOnFocus, speak, stop]);
  
  // Manejar foco en mensajes (solo por mouse)
  const handleMessageFocus = React.useCallback((index) => {
    setFocusedMessageIndex(index);
    setFocusedCodeButton(null);
    const message = chatHistory[index];
    const role = message.role === 'user' ? 'Tu mensaje' : 'Respuesta del copiloto';
    speakOnHover(`Mensaje ${index + 1} de ${chatHistory.length}. ${role}`, 300);
  }, [chatHistory, speakOnHover]);

  // Manejar click en mensaje (desactivar navegación por teclado)
  const handleMessageClick = React.useCallback((index) => {
    setIsKeyboardNavigation(false);
    handleMessageFocus(index);
  }, [handleMessageFocus]);

  // Función para leer el texto mientras se escribe
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
    setNewName('');
    setDialogOpen(true);
    speak('Diálogo de crear nuevo archivo abierto');
  };

  const handleCreateFolder = () => {
    // Verificar límites antes de crear
    const testFolders = [...folders, { id: Date.now(), name: 'test', files: [], type: 'folder' }];
    if (!checkStorageLimits(files, testFolders)) return;

    setIsFile(false);
    setNewName('');
    setDialogOpen(true);
    speak('Diálogo de crear nueva carpeta abierto');
  };

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
          onFileOpen(newFile.name, event.target.result);
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
      const fileName = newName.includes('.') ? newName : `${newName}.txt`;
      const newFile = {
        id: Date.now(),
        name: fileName,
        content: '',
        type: 'file'
      };
      
      const testFiles = [...files, newFile];
      if (!checkStorageLimits(testFiles, folders)) return;

      setFiles(prev => [...prev, newFile]);
      
      // CORRECCIÓN: Asegurarse de que onFileOpen se llame correctamente
      if (onFileOpen) {
        onFileOpen(fileName, '');
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
  };

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

  const ChatHistory = ({ chatHistory, themeColors, focusedMessageIndex, onMessageFocus, onMessageClick, messageRefs, focusedCodeButton }) => {
    const chatEndRef = React.useRef(null);
    const [copiedStates, setCopiedStates] = React.useState({});

    React.useEffect(() => {
      if (chatHistory.length > 0) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, [chatHistory.length]);

    const handleCopy = (messageIndex, codeIndex) => {
      const key = `${messageIndex}-${codeIndex}`;
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    };

    return (
      <div>
        {chatHistory.map((message, messageIndex) => {
          const content = typeof message.content === 'string' ? message.content : String(message.content || '');
          const isFocused = focusedMessageIndex === messageIndex && isKeyboardNavigation;
          let codeBlockIndex = 0;
          
          return (
            <div 
              key={messageIndex}
              ref={el => messageRefs.current[messageIndex] = el}
              tabIndex={-1}
              onClick={() => onMessageClick(messageIndex)}
              onMouseEnter={() => !isKeyboardNavigation && onMessageFocus(messageIndex)}
              role="article"
              aria-label={`Mensaje ${messageIndex + 1} de ${chatHistory.length}. ${message.role === "user" ? "Tu mensaje" : "Respuesta del copiloto"}`}
              style={{ 
                marginBottom: "16px",
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: isFocused ? themeColors.hover : 'transparent',
                border: isFocused ? `2px solid ${themeColors.accent}` : '2px solid transparent',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Typography style={{ 
                color: themeColors.text, 
                fontWeight: 700,
                marginBottom: "6px",
                fontSize: '0.95rem'
              }}>
                {message.role === "user" ? "Tú" : "Copiloto"}
              </Typography>
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
                  h1: ({ node, ...props }) => (
                    <Typography
                      {...props}
                      variant="h5"
                      style={{ 
                        color: themeColors.text,
                        fontWeight: 700,
                        marginTop: "12px",
                        marginBottom: "8px"
                      }}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <Typography
                      {...props}
                      variant="h6"
                      style={{ 
                        color: themeColors.text,
                        fontWeight: 600,
                        marginTop: "10px",
                        marginBottom: "6px"
                      }}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <Typography
                      {...props}
                      variant="subtitle1"
                      style={{ 
                        color: themeColors.accent,
                        fontWeight: 600,
                        marginTop: "8px",
                        marginBottom: "4px"
                      }}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      {...props}
                      style={{
                        color: themeColors.text,
                        marginTop: "4px",
                        marginBottom: "8px",
                        paddingLeft: "20px",
                        listStyleType: 'disc'
                      }}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      {...props}
                      style={{
                        color: themeColors.text,
                        marginTop: "4px",
                        marginBottom: "8px",
                        paddingLeft: "20px"
                      }}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li
                      {...props}
                      style={{
                        color: themeColors.text,
                        marginBottom: "4px",
                        lineHeight: "1.5"
                      }}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong
                      {...props}
                      style={{
                        color: themeColors.accent,
                        fontWeight: 700
                      }}
                    />
                  ),
                  em: ({ node, ...props }) => (
                    <em
                      {...props}
                      style={{
                        color: themeColors.textSecondary,
                        fontStyle: 'italic'
                      }}
                    />
                  ),
                  code: ({ node, inline, className, children, ...props }) => {
                    const isPython = className === 'language-python';
                    
                    if (inline) {
                      return (
                        <code 
                          {...props} 
                          style={{ 
                            backgroundColor: themeColors.surface,
                            color: themeColors.accent,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontSize: '0.85em',
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                            border: `1px solid ${themeColors.border}`,
                            fontWeight: 500
                          }}
                        >
                          {children}
                        </code>
                      );
                    }

                    const currentCodeIndex = codeBlockIndex++;
                    const copyKey = `${messageIndex}-${currentCodeIndex}`;
                    const copied = copiedStates[copyKey] || false;
                    const isButtonFocused = focusedCodeButton?.messageIndex === messageIndex && 
                                          focusedCodeButton?.codeIndex === currentCodeIndex;

                    return (
                      <div style={{ 
                        position: "relative",
                        marginTop: isPython ? "28px" : "8px",
                        marginBottom: "12px"
                      }}>
                        {isPython && (
                          <CopyToClipboard 
                            text={String(children)} 
                            onCopy={() => handleCopy(messageIndex, currentCodeIndex)}
                          >
                            <Button
                              variant="contained"
                              size="small"
                              tabIndex={-1}
                              data-message-index={messageIndex}
                              data-code-index={currentCodeIndex}
                              data-copy-button="true"
                              aria-label={`Copiar código Python. ${copied ? 'Código copiado' : 'Presiona Enter para copiar'}`}
                              onMouseEnter={() => !isKeyboardNavigation && speakOnHover(`Botón copiar código Python. ${copied ? 'Código copiado' : 'Click para copiar'}`)}
                              onMouseLeave={cancelHoverSpeak}
                              sx={{
                                position: "absolute",
                                top: -24,
                                right: 8,
                                backgroundColor: copied ? themeColors.success : themeColors.accent,
                                color: themeColors.background === '#000000' || 
                                      themeColors.background === '#0d1117' 
                                  ? '#000000' 
                                  : '#ffffff',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                minWidth: '60px',
                                height: '24px',
                                padding: '2px 8px',
                                textTransform: 'none',
                                zIndex: 10,
                                transition: 'all 0.3s ease',
                                outline: isButtonFocused ? `3px solid ${themeColors.accent}` : 'none',
                                outlineOffset: '2px',
                                '&:hover': {
                                  backgroundColor: copied ? themeColors.success : themeColors.accent,
                                  filter: 'brightness(0.85)'
                                },
                                '&:focus': {
                                  outline: `2px solid ${themeColors.accent}`,
                                  outlineOffset: '2px'
                                }
                              }}
                            >
                              {copied ? '✓ Copiado' : 'Copiar'}
                            </Button>
                          </CopyToClipboard>
                        )}
                        <pre style={{ 
                          whiteSpace: "pre-wrap", 
                          wordWrap: "break-word",
                          backgroundColor: themeColors.surface,
                          padding: '10px',
                          borderRadius: '4px',
                          border: `1px solid ${themeColors.border}`,
                          margin: 0,
                          overflow: 'auto',
                          maxHeight: '350px',
                          fontSize: '0.85rem',
                          lineHeight: '1.4'
                        }}>
                          <code {...props} style={{ 
                            color: themeColors.text,
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                          }}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      {...props}
                      style={{
                        borderLeft: `3px solid ${themeColors.accent}`,
                        paddingLeft: '12px',
                        marginLeft: 0,
                        marginTop: '8px',
                        marginBottom: '8px',
                        color: themeColors.textSecondary,
                        fontStyle: 'italic'
                      }}
                    />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      style={{
                        color: themeColors.accent,
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                }}
              />
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
    );
  };
  
  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  const handleGenerateCode = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    
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
      
    } catch (error) {
      console.error('Error generating code:', error);
      const errorMessage = { role: 'assistant', content: 'Error al generar respuesta. Inténtalo de nuevo.' };
      setChatHistory([...updatedHistory, errorMessage]);
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

  // Enfocar automáticamente en el último mensaje cuando se agrega uno nuevo
  React.useEffect(() => {
    if (chatHistory.length > 0 && tabIndex === 1 && isKeyboardNavigation) {
      setFocusedMessageIndex(chatHistory.length - 1);
      setFocusedCodeButton(null);
    }
  }, [chatHistory.length, tabIndex, isKeyboardNavigation]);

  // Anunciar elemento enfocado
  React.useEffect(() => {
    if (collapsed || tabIndex === 1) return;
    
    const description = getFocusedElementDescription();
    if (description) {
      speakOnFocus(description);
    }
  }, [selectedIndex, focusedSection, collapsed, getFocusedElementDescription, speakOnFocus, tabIndex]);

  // Focus en el componente al montar
  React.useEffect(() => {
    if (fileManagerRef.current && !collapsed) {
      fileManagerRef.current.focus();
    }
  }, [collapsed]);

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

  // Resetear navegación por teclado al cambiar de tab
  React.useEffect(() => {
    if (tabIndex !== 1) {
      setIsKeyboardNavigation(false);
      setFocusedMessageIndex(-1);
      setFocusedCodeButton(null);
    }
  }, [tabIndex]);

  // Guardar en localStorage cuando cambien files o folders
  React.useEffect(() => {
    localStorage.setItem('files', JSON.stringify(files));
  }, [files]);

  React.useEffect(() => {
    localStorage.setItem('folders', JSON.stringify(folders));
  }, [folders]);

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

  // Registrar componente en el sistema de navegación
  React.useEffect(() => {
    const fileManagerAPI = {
      focus: () => {
        if (fileManagerContainerRef.current) {
          fileManagerContainerRef.current.focus();
          setFocusedSection('buttons');
          setSelectedIndex(0);
          speak('Gestor de archivos. Presiona Tab para navegar entre secciones. Use las flechas para navegar dentro de cada sección.');
        }
      },
      createFile: handleCreateFile,
      createFolder: handleCreateFolder,
      openFile: handleOpenFile,
      openFolder: handleOpenFolder,
      openChat: () => {
        setTabIndex(1);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
        speak('Chat con copiloto activado');
      },
      openStructure: () => {
        setTabIndex(0);
        setFocusedSection('structure');
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
  }, [registerComponent, unregisterComponent, speak, tabIndex]);

  return (
    <Box 
      ref={fileManagerContainerRef}
      tabIndex={0}
      onKeyDown={tabIndex === 1 ? handleChatKeyDown : handleKeyDown}
      onFocus={() => {
        setIsFileManagerFocused(true);
        setFocusedComponent('filemanager');
        if (tabIndex === 0) {
          speakOnFocus('Gestor de archivos. Presiona Tab para navegar entre secciones.');
        } else {
          speakOnFocus('Chat con copiloto. Presiona i para ir al campo de texto.');
        }
      }}
      onBlur={() => {
        setIsFileManagerFocused(false);
      }}
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
        outline: isFileManagerFocused ? `3px solid ${themeColors.accent}` : 'none',
        outlineOffset: '-3px'
      }}
      role="complementary"
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
              onMouseLeave={cancelHoverSpeak}
            />
            <Tab 
              label="Chat" 
              aria-label="Pestaña de chat con copiloto"
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
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              minHeight: 0,
              backgroundColor: themeColors.background
            }}>
              <Box 
                ref={chatContainerRef}
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
                  Bienvenido a tu copiloto, estoy aquí para ayudarte a hacer las cosas más rápido.
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
                      • <strong>Enter</strong> - Leer mensaje completo<br/>
                      • <strong>Tab</strong> - Ir a botones de código<br/>
                      • <strong>Esc</strong> - Detener lectura / Volver a mensajes desde input
                    </Typography>
                    <ChatHistory 
                      chatHistory={chatHistory} 
                      themeColors={themeColors}
                      focusedMessageIndex={focusedMessageIndex}
                      onMessageFocus={handleMessageFocus}
                      onMessageClick={handleMessageClick}
                      messageRefs={messageRefs}
                      focusedCodeButton={focusedCodeButton}
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
                  onChange={handlePromptChange} // Usar la nueva función
                  onKeyDown={(e) => {
                    // Solo manejar Enter, permitir espacio normal
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      
                      // Limpiar el timeout de typing si existe
                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }
                      
                      handleGenerateCode();
                    } else if (e.key === 'Backspace' || e.key === 'Delete') {
                      // Detener lectura al borrar
                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }
                    }
                  }}
                  onFocus={() => {
                    stop();
                    setIsKeyboardNavigation(false);
                    setFocusedMessageIndex(-1);
                    setFocusedCodeButton(null);
                    setLastTypedWord('');
                    
                    // Leer instrucción inicial
                    speakOnFocus('Campo de texto para hacer preguntas al copiloto. Presiona Enter para enviar o Shift más Enter para nueva línea. Esc para volver a navegar mensajes. Presiona i desde cualquier lugar para volver aquí');
                    
                    // Si hay texto en el campo, leerlo después de la instrucción
                    if (prompt.trim()) {
                      setTimeout(() => {
                        speak(`Texto actual: ${prompt}`, { rate: 1.3 });
                      }, 3000);
                    }
                  }}
                  onBlur={() => {
                    // Detener lectura al salir del campo
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
                          onFocus={() => speakOnFocus('Enviar mensaje al copiloto')}
                          aria-label="Enviar mensaje al copiloto"
                          onMouseEnter={() => speakOnHover('Enviar mensaje al copiloto')}
                          onMouseLeave={cancelHoverSpeak}
                          sx={{ 
                            color: themeColors.accent,
                            '&.Mui-disabled': {
                              color: themeColors.textSecondary,
                              opacity: 0.5
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
                              backgroundColor: focusedSection === 'buttons' && selectedIndex === 0 ? themeColors.hover : 'transparent',
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
                              backgroundColor: focusedSection === 'buttons' && selectedIndex === 1 ? themeColors.hover : 'transparent',
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
                              backgroundColor: focusedSection === 'buttons' && selectedIndex === 2 ? themeColors.hover : 'transparent',
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
                              backgroundColor: focusedSection === 'buttons' && selectedIndex === 3 ? themeColors.hover : 'transparent',
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
                        if (focusedSection !== 'files') return null;
                        
                        const isSelected = selectedIndex === index;
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
                                  backgroundColor: isSelected 
                                    ? themeColors.accent 
                                    : 'transparent',
                                  border: isSelected ? `2px solid ${themeColors.accent}` : '2px solid transparent',
                                  '&:hover': !isSelected ? {
                                    backgroundColor: themeColors.hover,
                                    border: `2px solid ${themeColors.accent}`
                                  } : {}
                                }}
                                onClick={() => toggleFolder(element.id)}
                                onContextMenu={(e) => handleContextMenu(e, element)}
                                aria-label={`Carpeta ${element.name}, ${openFolders[element.id] ? 'expandida' : 'colapsada'}, contiene ${element.files.length} archivos`}
                                onMouseEnter={() => speakOnHover(`Carpeta ${element.name}, ${openFolders[element.id] ? 'expandida' : 'colapsada'}, contiene ${element.files.length} archivos`)}
                                onMouseLeave={cancelHoverSpeak}
                              >
                                {openFolders[element.id] ? (
                                  <ExpandLessIcon sx={{ color: isSelected ? themeColors.background : themeColors.accent }} />
                                ) : (
                                  <ExpandMoreIcon sx={{ color: isSelected ? themeColors.background : themeColors.accent }} />
                                )}
                                <Folder sx={{ mr: 1, color: isSelected ? themeColors.background : themeColors.accent }} />
                                <Typography variant="body2" sx={{ 
                                  flex: 1, 
                                  color: isSelected ? themeColors.background : themeColors.text,
                                  fontWeight: isSelected ? 600 : 400
                                }}>
                                  {element.name}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleContextMenu(e, element);
                                  }}
                                  aria-label="Más opciones"
                                  sx={{ color: isSelected ? themeColors.background : themeColors.text }}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              <Collapse in={openFolders[element.id]}>
                                <Box sx={{ ml: 2 }}>
                                  {element.files.map((file) => {
                                    const fileElements = getNavigableElements();
                                    const fileIndex = fileElements.findIndex(el => 
                                      el.type === 'file' && el.id === file.id
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
                                          backgroundColor: isFileSelected || isCurrentChildFile ? themeColors.hover : 'transparent',
                                          border: (isFileSelected || isCurrentChildFile) ? `2px solid ${themeColors.accent}` : '2px solid transparent',
                                          '&:hover': !(isFileSelected || isCurrentChildFile) ? {
                                            backgroundColor: themeColors.hover
                                          } : {}
                                        }}
                                        onClick={() => handleFileClick(file)}
                                        onContextMenu={(e) => handleContextMenu(e, { ...file, parentFolder: element.id })}
                                        aria-label={`Archivo ${file.name}${isCurrentChildFile ? ', actualmente abierto' : ''}`}
                                        onMouseEnter={() => speakOnHover(`Archivo ${file.name}${isCurrentChildFile ? ', actualmente abierto' : ''}`)}
                                        onMouseLeave={cancelHoverSpeak}
                                      >
                                        <InsertDriveFile sx={{ 
                                          mr: 1, 
                                          fontSize: 16, 
                                          color: (isFileSelected || isCurrentChildFile) ? themeColors.accent : themeColors.info 
                                        }} />
                                        <Typography variant="caption" sx={{ 
                                          flex: 1,
                                          fontWeight: (isFileSelected || isCurrentChildFile) ? 600 : 400
                                        }}>
                                          {file.name}
                                        </Typography>
                                        <IconButton 
                                          size="small" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleContextMenu(e, { ...file, parentFolder: element.id });
                                          }}
                                          aria-label="Más opciones"
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
                              onClick={() => handleFileClick(element)}
                              onContextMenu={(e) => handleContextMenu(e, element)}
                              aria-label={`Archivo ${element.name}${isCurrentFile ? ', actualmente abierto' : ''}`}
                              onMouseEnter={() => speakOnHover(`Archivo ${element.name}${isCurrentFile ? ', actualmente abierto' : ''}`)}
                              onMouseLeave={cancelHoverSpeak}
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
                                {element.name}
                              </Typography>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContextMenu(e, element);
                                }}
                                aria-label="Más opciones"
                                sx={{ color: isSelected ? themeColors.background : themeColors.text }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          );
                        }
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
                    onClick={() => setIsCodeStructureOpen(!isCodeStructureOpen)}
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
                          const isFocused = focusedSection === 'structure' && selectedIndex === index;
                          
                          return (
                            <ListItem
                              key={index}
                              sx={{
                                borderBottom: `1px solid ${themeColors.border}`,
                                py: 1,
                                px: 1.5,
                                backgroundColor: isFocused ? themeColors.accent : 'transparent',
                                '&:hover': {
                                  backgroundColor: themeColors.hover
                                }
                              }}
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
                // ...código similar al anterior panel pero sin split...
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
                            backgroundColor: focusedSection === 'buttons' && selectedIndex === 0 ? themeColors.hover : 'transparent',
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
                            backgroundColor: focusedSection === 'buttons' && selectedIndex === 1 ? themeColors.hover : 'transparent',
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
                            backgroundColor: focusedSection === 'buttons' && selectedIndex === 2 ? themeColors.hover : 'transparent',
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
                            backgroundColor: focusedSection === 'buttons' && selectedIndex === 3 ? themeColors.hover : 'transparent',
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
                      const isFocused = focusedSection === 'files' && selectedIndex === index;
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
                                  const isFileFocused = focusedSection === 'files' && selectedIndex === fileIndex;
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
            onMouseEnter={() => speakOnHover('Expandir o colapsar carpeta')}
            onMouseLeave={cancelHoverSpeak}
          >
            {/* <FolderOpenIcon sx={{ mr: 1, fontSize: 18 }} /> */}
            {openFolders[selectedItem.id] ? 'Colapsar' : 'Expandir'}
          </MenuItem>
        )}

        <MenuItem 
          onClick={handleRename}
          aria-label="Renombrar"
          onMouseEnter={() => speakOnHover('Renombrar')}
          onMouseLeave={cancelHoverSpeak}
        >
          {/* <EditIcon sx={{ mr: 1, fontSize: 18 }} /> */}
          Renombrar
        </MenuItem>
        
        <MenuItem 
          onClick={handleDelete}
          aria-label="Eliminar"
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
        onClose={() => setDialogOpen(false)}
        aria-labelledby="dialog-title"
        PaperProps={{
          sx: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            border: `1px solid ${themeColors.border}`
          }
        }}
      >
        <DialogTitle id="dialog-title" sx={{ color: themeColors.text }}>
          {isFile ? 'Crear Nuevo Archivo' : 'Crear Nueva Carpeta'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: themeColors.textSecondary }}>
            Ingresa el nombre para {isFile ? 'el archivo' : 'la carpeta'}:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleDialogConfirm();
              }
            }}
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
            onClick={() => setDialogOpen(false)} 
            sx={{ color: themeColors.textSecondary }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDialogConfirm} 
            variant="contained"
            sx={{
              backgroundColor: themeColors.accent,
              color: themeColors.background,
              '&:hover': {
                backgroundColor: themeColors.accent,
                filter: 'brightness(0.9)'
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
        onClose={() => setRenameDialogOpen(false)}
        aria-labelledby="rename-dialog-title"
        PaperProps={{
          sx: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            border: `1px solid ${themeColors.border}`
          }
        }}
      >
        <DialogTitle id="rename-dialog-title" sx={{ color: themeColors.text }}>
          Renombrar {selectedItem?.type === 'folder' ? 'Carpeta' : 'Archivo'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nuevo nombre"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                confirmRename();
              }
            }}
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
          <Button onClick={() => setRenameDialogOpen(false)} sx={{ color: themeColors.textSecondary }}>
            Cancelar
          </Button>
          <Button onClick={confirmRename} variant="contained" sx={{
              backgroundColor: themeColors.accent,
              color: themeColors.background,
              '&:hover': {
                backgroundColor: themeColors.accent,
                filter: 'brightness(0.9)'
              }
            }}>
            Renombrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        PaperProps={{
          sx: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            border: `1px solid ${themeColors.border}`
          }
        }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ color: themeColors.text }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: themeColors.textSecondary }}>
            ¿Estás seguro de que deseas eliminar {selectedItem?.type === 'folder' ? 'la carpeta' : 'el archivo'} "{selectedItem?.name}"?
            {selectedItem?.type === 'folder' && ' Esto eliminará todos los archivos dentro de la carpeta.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: themeColors.textSecondary }}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmDelete} 
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
        onClose={() => setStorageWarningOpen(false)}
        aria-labelledby="storage-warning-title"
        PaperProps={{
          sx: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            border: `2px solid ${themeColors.warning}`
          }
        }}
      >
        <DialogTitle id="storage-warning-title" sx={{ color: themeColors.warning, display: 'flex', alignItems: 'center' }}>
          <WarningIcon sx={{ mr: 1 }} />
          Límite de Almacenamiento
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: themeColors.text }}>
            {storageWarningMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setStorageWarningOpen(false)} 
            variant="contained"
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
    </Box>
  );
});

export default FileManager;