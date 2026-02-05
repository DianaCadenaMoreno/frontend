import React, { useImperativeHandle, useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Popover,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAppNavigation } from '../contexts/NavigationContext';
import { useScreenReader } from '../contexts/ScreenReaderContext';

const menuItems = {
  archivos: ['Nuevo archivo de texto', 'Nuevo archivo', 'Abrir un archivo', 'Abrir una carpeta'],
  ajustes: ['Apariencia'],
  ayuda: ['Bienvenida', 'Ver todos los comandos', 'Documentación', 'Manual de usuario'],
};

// Constantes para límites de almacenamiento (igual que FileManager)
const MAX_FILES = 50;
const MAX_FOLDERS = 20;
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB en bytes

const Navbar = React.forwardRef(({ onOpenAppearanceModal, onFileOpen }, ref) => {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElArchivos, setAnchorElArchivos] = React.useState(null);
  const [anchorElAjustes, setAnchorElAjustes] = React.useState(null);
  const [anchorElAyuda, setAnchorElAyuda] = React.useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMenu, setSelectedMenu] = useState('archivos');
  const [focusedMenuItem, setFocusedMenuItem] = useState(0);
  
  // Estados para diálogos (igual que FileManager)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isFile, setIsFile] = useState(true);
  const [storageWarningOpen, setStorageWarningOpen] = useState(false);
  const [storageWarningMessage, setStorageWarningMessage] = useState('');
  const [extensionErrorOpen, setExtensionErrorOpen] = useState(false);
  
  const { registerComponent, unregisterComponent, setFocusedComponent } = useAppNavigation();
  const { speak, speakOnHover, speakOnFocus, cancelHoverSpeak, announce, stop } = useScreenReader();
  
  const navbarRef = useRef(null);
  const menuRefs = useRef({});
  const createDialogInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Función para ir a Welcome
  const goToWelcome = () => {
    speak('Abriendo pantalla de bienvenida');
    window.dispatchEvent(new CustomEvent('codeflow-show-welcome'));
  };

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

    return true;
  }, [announce, speak]);

  // Validar extensión de archivo
  const validateFileExtension = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    return ext === 'txt' || ext === 'py';
  };

  // Manejar creación de archivo de texto (.txt por defecto)
  const handleCreateTextFile = () => {
    const files = JSON.parse(localStorage.getItem('files')) || [];
    const folders = JSON.parse(localStorage.getItem('folders')) || [];
    
    const testFiles = [...files, { id: Date.now(), name: 'test', content: '', type: 'file' }];
    if (!checkStorageLimits(testFiles, folders)) return;

    setIsFile(true);
    setNewName('');
    setDialogOpen(true);
    speak('Diálogo de crear nuevo archivo de texto abierto. El archivo tendrá extensión .txt por defecto');
  };

  // Manejar creación de archivo Python (.py)
  const handleCreatePythonFile = () => {
    const files = JSON.parse(localStorage.getItem('files')) || [];
    const folders = JSON.parse(localStorage.getItem('folders')) || [];
    
    const testFiles = [...files, { id: Date.now(), name: 'test', content: '', type: 'file' }];
    if (!checkStorageLimits(testFiles, folders)) return;

    setIsFile(true);
    setNewName('');
    setDialogOpen(true);
    speak('Diálogo de crear nuevo archivo abierto. Solo se permiten extensiones .txt o .py');
  };

  // Manejar apertura de archivo desde sistema
  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.py,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'py' && ext !== 'txt') {
          speak('Solo se pueden abrir archivos Python (.py) o de texto (.txt)');
          setStorageWarningMessage('Solo se pueden abrir archivos Python (.py) o de texto (.txt)');
          setStorageWarningOpen(true);
          return;
        }

        const files = JSON.parse(localStorage.getItem('files')) || [];
        const folders = JSON.parse(localStorage.getItem('folders')) || [];
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          const newFile = {
            id: Date.now(),
            name: file.name,
            content: content,
            type: 'file'
          };
          
          const testFiles = [...files, newFile];
          if (!checkStorageLimits(testFiles, folders)) return;

          const updatedFiles = [...files, newFile];
          localStorage.setItem('files', JSON.stringify(updatedFiles));
          
          // Disparar evento para que FileManager se actualice
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'files',
            newValue: JSON.stringify(updatedFiles)
          }));
          
          // Abrir el archivo en el editor
          if (onFileOpen) {
            onFileOpen(newFile.name, newFile.content, newFile.id);
          }
          
          speak(`Archivo ${file.name} abierto correctamente`);
        };
        reader.readAsText(file);
      }
    };
    input.click();
    speak('Abriendo selector de archivos. Solo archivos Python y texto son permitidos');
  };

  // Manejar apertura de carpeta desde sistema
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
        speak('La carpeta no contiene archivos Python o de texto válidos');
        setStorageWarningMessage('La carpeta no contiene archivos Python (.py) o de texto (.txt) válidos.');
        setStorageWarningOpen(true);
        return;
      }

      if (validFiles.length !== filesList.length) {
        const ignoredCount = filesList.length - validFiles.length;
        speak(`Se ignoraron ${ignoredCount} archivos con extensiones no permitidas`);
      }

      const files = JSON.parse(localStorage.getItem('files')) || [];
      const folders = JSON.parse(localStorage.getItem('folders')) || [];

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
            content: event.target.result,
            type: 'file',
            parentFolder: newFolder.id
          });

          filesRead++;
          if (filesRead === validFiles.length) {
            const testFolders = [...folders, newFolder];
            if (!checkStorageLimits(files, testFolders)) return;

            const updatedFolders = [...folders, newFolder];
            localStorage.setItem('folders', JSON.stringify(updatedFolders));
            
            // Disparar evento para que FileManager se actualice
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'folders',
              newValue: JSON.stringify(updatedFolders)
            }));
            
            speak(`Carpeta ${folderName} abierta con ${validFiles.length} archivos`);
          }
        };
        reader.readAsText(file);
      });
    };
    input.click();
    speak('Abriendo selector de carpetas. Solo archivos Python y texto serán importados');
  };

  // Confirmar creación de archivo/carpeta
  const handleDialogConfirm = () => {
    if (!newName.trim()) {
      speak('El nombre no puede estar vacío');
      return;
    }

    const files = JSON.parse(localStorage.getItem('files')) || [];
    const folders = JSON.parse(localStorage.getItem('folders')) || [];
    
    if (isFile) {
      // Determinar extensión
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
        type: 'file'
      };
      
      const testFiles = [...files, newFile];
      if (!checkStorageLimits(testFiles, folders)) return;

      const updatedFiles = [...files, newFile];
      localStorage.setItem('files', JSON.stringify(updatedFiles));
      
      // Disparar evento para que FileManager se actualice
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'files',
        newValue: JSON.stringify(updatedFiles)
      }));
      
      // Abrir el archivo en el editor
      if (onFileOpen) {
        onFileOpen(newFile.name, newFile.content, newFile.id);
      }
      
      speak(`Archivo ${fileName} creado correctamente y abierto en el editor`);
    }
    
    setDialogOpen(false);
    setNewName('');
  };

  // Manejar cambios en el input con lectura
  const handleDialogChange = React.useCallback((e) => {
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
        speak(`Nombre actual: ${newValue}`);
      }
    }, 1500);
  }, [speak]);

  // Manejar teclas en diálogo
  const handleDialogKeyDown = React.useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      stop();
      setDialogOpen(false);
      setNewName('');
      speak('Diálogo cancelado');
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (newName.length > 0) {
        const deletedChar = e.key === 'Backspace' ? newName.slice(-1) : '';
        if (deletedChar) {
          speak(`Borrado: ${deletedChar}`, { rate: 1.5 });
        }
      }
    }
  }, [stop, speak, newName]);

  // Efecto para enfocar input cuando se abre el diálogo
  useEffect(() => {
    if (dialogOpen) {
      stop();
      setTimeout(() => {
        if (createDialogInputRef.current) {
          createDialogInputRef.current.focus();
        }
        const dialogType = isFile ? 'archivo' : 'carpeta';
        const extensionInfo = isFile ? '. Solo se permiten extensiones .txt o .py. Si no escribes extensión, se usará .txt' : '';
        speak(`Diálogo de crear ${dialogType} abierto. Escribe el nombre y presiona Enter para crear${extensionInfo}`);
      }, 100);
    }
  }, [dialogOpen, isFile, speak, stop]);

  // Registrar componente en el sistema de navegación
  useEffect(() => {
    const navbarAPI = {
      focus: () => {
        if (navbarRef.current) {
          navbarRef.current.focus();
          speak('Barra de navegación. Usa las flechas izquierda y derecha para navegar entre menús. Enter para abrir un menú.');
        }
      },
      openArchivosMenu: () => {
        const anchor = menuRefs.current['archivos'] || navbarRef.current;
        setAnchorElArchivos(anchor);
        setSelectedMenu('archivos');
        setFocusedMenuItem(0);
        speak('Menú archivos abierto. 4 opciones disponibles. Usa las flechas arriba y abajo para navegar.');
      },
      openAjustesMenu: () => {
        const anchor = menuRefs.current['ajustes'] || navbarRef.current;
        setAnchorElAjustes(anchor);
        setSelectedMenu('ajustes');
        setFocusedMenuItem(0);
        speak('Menú ajustes abierto. 1 opción disponible. Usa las flechas arriba y abajo para navegar.');
      },
      openAyudaMenu: () => {
        const anchor = menuRefs.current['ayuda'] || navbarRef.current;
        setAnchorElAyuda(anchor);
        setSelectedMenu('ayuda');
        setFocusedMenuItem(0);
        speak('Menú ayuda abierto. 4 opciones disponibles. Usa las flechas arriba y abajo para navegar.');
      }
    };

    registerComponent('navbar', navbarAPI);
    registerComponent('navbar-archivos', { focus: navbarAPI.openArchivosMenu });
    registerComponent('navbar-ajustes', { focus: navbarAPI.openAjustesMenu });
    registerComponent('navbar-ayuda', { focus: navbarAPI.openAyudaMenu });

    return () => {
      unregisterComponent('navbar');
      unregisterComponent('navbar-archivos');
      unregisterComponent('navbar-ajustes');
      unregisterComponent('navbar-ayuda');
    };
  }, [registerComponent, unregisterComponent, speak]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (navbarRef.current) {
        navbarRef.current.focus();
      }
    },
    openArchivosMenu: () => {
     const anchor = menuRefs.current['archivos'] || navbarRef.current;
      setAnchorElArchivos(anchor);
      setSelectedMenu('archivos');
      setFocusedMenuItem(0);
    },
  }));

  const handleMenuOpen = (anchor, setter, menuName) => {
    setter(anchor);
    setSelectedMenu(menuName);
    setFocusedMenuItem(0);
    
    const itemCount = menuItems[menuName].length;
    speak(`Menú ${menuName} abierto. ${itemCount} opciones disponibles. Usa las flechas arriba y abajo para navegar.`);
  };

  const handleMenuClose = (setter) => {
    setter(null);
    setFocusedMenuItem(0);
    if (navbarRef.current) {
      navbarRef.current.focus();
    }
  };

  const getCurrentAnchor = () => {
    switch (selectedMenu) {
      case 'archivos': return anchorElArchivos;
      case 'ajustes': return anchorElAjustes;
      case 'ayuda': return anchorElAyuda;
      default: return null;
    }
  };

  const getCurrentSetter = () => {
    switch (selectedMenu) {
      case 'archivos': return setAnchorElArchivos;
      case 'ajustes': return setAnchorElAjustes;
      case 'ayuda': return setAnchorElAyuda;
      default: return () => {};
    }
  };

  // Ejecutar acción del menú
  const executeMenuAction = (item) => {
    switch (item) {
      case 'Nuevo archivo de texto':
        handleCreateTextFile();
        break;
      case 'Nuevo archivo':
        handleCreatePythonFile();
        break;
      case 'Abrir un archivo':
        handleOpenFile();
        break;
      case 'Abrir una carpeta':
        handleOpenFolder();
        break;
      case 'Apariencia':
        onOpenAppearanceModal();
        break;
      case 'Bienvenida':
        goToWelcome();
        break;
      case 'Ver todos los comandos':
        window.dispatchEvent(new CustomEvent('codeflow-show-help'));
        speak('Mostrando todos los comandos disponibles');
        break;
      case 'Documentación':
        window.open('https://github.com/DianaCadenaMoreno/backend', '_blank');
        speak('Abriendo documentación en nueva pestaña');
        break;
      case 'Manual de usuario':
        window.dispatchEvent(new CustomEvent('codeflow-show-manual'));
        speak('Abriendo manual de usuario');
        break;
      default:
        speak(`Opción ${item} seleccionada`);
        break;
    }
  };

  const handleKeyDown = (event) => {
    const currentAnchor = getCurrentAnchor();
    const currentMenuItems = menuItems[selectedMenu];
    
    // Si hay un menú abierto
    if (currentAnchor) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedMenuItem(prev => {
            const newIndex = (prev + 1) % currentMenuItems.length;
            speak(currentMenuItems[newIndex]);
            return newIndex;
          });
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          setFocusedMenuItem(prev => {
            const newIndex = (prev - 1 + currentMenuItems.length) % currentMenuItems.length;
            speak(currentMenuItems[newIndex]);
            return newIndex;
          });
          break;
          
        case 'ArrowRight':
          event.preventDefault();
          const menuKeys = Object.keys(menuItems);
          const nextMenuIndex = (menuKeys.indexOf(selectedMenu) + 1) % menuKeys.length;
          const nextMenu = menuKeys[nextMenuIndex];
          
          handleMenuClose(getCurrentSetter());
          setTimeout(() => {
            const anchor = menuRefs.current[nextMenu] || navbarRef.current;
            if (nextMenu === 'archivos') handleMenuOpen(anchor, setAnchorElArchivos, 'archivos');
            else if (nextMenu === 'ajustes') handleMenuOpen(anchor, setAnchorElAjustes, 'ajustes');
            else handleMenuOpen(anchor, setAnchorElAyuda, 'ayuda');
          }, 100);
          break;
          
        case 'ArrowLeft':
          event.preventDefault();
          const menuKeys2 = Object.keys(menuItems);
          const prevMenuIndex = (menuKeys2.indexOf(selectedMenu) - 1 + menuKeys2.length) % menuKeys2.length;
          const prevMenu = menuKeys2[prevMenuIndex];
          
          handleMenuClose(getCurrentSetter());
          setTimeout(() => {
            const anchor = menuRefs.current[prevMenu] || navbarRef.current;
            if (prevMenu === 'archivos') handleMenuOpen(anchor, setAnchorElArchivos, 'archivos');
            else if (prevMenu === 'ajustes') handleMenuOpen(anchor, setAnchorElAjustes, 'ajustes');
            else handleMenuOpen(anchor, setAnchorElAyuda, 'ayuda');
          }, 100);
          break;
          
        case 'Enter':
        case ' ':
          event.preventDefault();
          const selectedItem = currentMenuItems[focusedMenuItem];
          speak(`Seleccionado: ${selectedItem}`);
          handleMenuClose(getCurrentSetter());
          executeMenuAction(selectedItem);
          break;
          
        case 'Escape':
          event.preventDefault();
          handleMenuClose(getCurrentSetter());
          speak('Menú cerrado');
          break;
          
        default:
          break;
      }
    } else {
      // Sin menú abierto, navegar entre botones de menú
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          const menuKeys = Object.keys(menuItems);
          const nextIndex = (menuKeys.indexOf(selectedMenu) + 1) % menuKeys.length;
          const nextMenu = menuKeys[nextIndex];
          setSelectedMenu(nextMenu);
          speak(`Menú ${nextMenu}`);
          break;
          
        case 'ArrowLeft':
          event.preventDefault();
          const menuKeys2 = Object.keys(menuItems);
          const prevIndex = (menuKeys2.indexOf(selectedMenu) - 1 + menuKeys2.length) % menuKeys2.length;
          const prevMenu = menuKeys2[prevIndex];
          setSelectedMenu(prevMenu);
          speak(`Menú ${prevMenu}`);
          break;
          
        case 'Enter':
        case ' ':
        case 'ArrowDown':
          event.preventDefault();
          const anchor = menuRefs.current[selectedMenu] || navbarRef.current;
          if (selectedMenu === 'archivos') handleMenuOpen(anchor, setAnchorElArchivos, 'archivos');
          else if (selectedMenu === 'ajustes') handleMenuOpen(anchor, setAnchorElAjustes, 'ajustes');
          else handleMenuOpen(anchor, setAnchorElAyuda, 'ayuda');
          break;
          
        default:
          break;
      }
    }
  };

  return (
    <>
      <AppBar 
        position="static" 
        sx={{ bgcolor: '#101B23' }} 
        ref={navbarRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setFocusedComponent('navbar');
          speakOnFocus('Barra de navegación. Usa las flechas izquierda y derecha para navegar entre menús. Enter para abrir un menú.');
        }}
        role="navigation"
        aria-label="Barra de navegación principal"
      >
        <Toolbar 
          disableGutters 
          sx={{ 
            px: 2,
            minHeight: '56px !important',
            width: '100%',
            maxWidth: '100%'
          }}
        >
          {/* Logo y título clickeables para ir a Welcome */}
          <Box
            onClick={goToWelcome}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                goToWelcome();
              }
            }}
            onMouseEnter={() => speakOnHover('Code Flow. Haz clic para ir a la pantalla de bienvenida')}
            onMouseLeave={cancelHoverSpeak}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              cursor: 'pointer',
              mr: 2,
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:focus': {
                outline: '2px solid #4FC3F7',
                outlineOffset: '2px',
              },
              '&:active': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Code Flow - Ir a pantalla de bienvenida"
          >
            <Box
              component="img"
              src="/logo_white.png"
              alt="Code Flow Logo"
              sx={{
                height: 40,
                width: 'auto',
                mr: 1,
              }}
            />
            <Typography
              variant="h6"
              noWrap
              component="span"
              sx={{
                fontFamily: 'sans-serif',
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'underline',
              }}
            >
              Code Flow
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {Object.entries(menuItems).map(([key, items]) => {
              const isSelected = selectedMenu === key;
              const anchorEl = key === 'archivos' ? anchorElArchivos : 
                             key === 'ajustes' ? anchorElAjustes : anchorElAyuda;
              const setter = key === 'archivos' ? setAnchorElArchivos :
                            key === 'ajustes' ? setAnchorElAjustes : setAnchorElAyuda;
              
              return (
                <React.Fragment key={key}>
                  <Button 
                    ref={(el) => (menuRefs.current[key] = el)}
                    onClick={(e) => handleMenuOpen(e.currentTarget, setter, key)}
                    onMouseEnter={() => speakOnHover(`Menú ${key}`)}
                    onMouseLeave={cancelHoverSpeak}
                    sx={{ 
                      my: 2, 
                      color: 'white',
                      textTransform: 'capitalize',
                      backgroundColor: isSelected && !anchorEl ? 'rgba(255,255,255,0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.2)'
                      }
                    }}
                    aria-label={`Menú ${key}`}
                    aria-haspopup="true"
                    aria-expanded={Boolean(anchorEl)}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Button>
                  <Popover
                    sx={{ 
                      '& .MuiPaper-root': {
                        backgroundColor: '#101B23',
                      }
                    }}
                    id={`menu-appbar-${key}`}
                    anchorEl={anchorEl}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    open={Boolean(anchorEl)}
                    onClose={() => handleMenuClose(setter)}
                    disableAutoFocus
                    disableEnforceFocus
                  >
                    <List sx={{ p: 0 }}>
                      {items.map((item, index) => (
                        <ListItem
                          key={item}
                          button
                          selected={focusedMenuItem === index}
                          onClick={() => {
                            handleMenuClose(setter);
                            executeMenuAction(item);
                          }}
                          onMouseEnter={() => {
                            setFocusedMenuItem(index);
                            speakOnHover(item);
                          }}
                          onMouseLeave={cancelHoverSpeak}
                          sx={{
                            color:'white', 
                            backgroundColor: focusedMenuItem === index ? '#333' : 'inherit',
                            '&:hover': {
                              backgroundColor: '#333'
                            },
                            '&.Mui-selected': {
                              backgroundColor: '#444',
                              '&:hover': {
                                backgroundColor: '#555'
                              }
                            }
                          }}
                          aria-label={item}
                        >
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                  </Popover>
                </React.Fragment>
              );
            })}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Dialog para crear archivo (mismo estilo que FileManager) */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => {
          stop();
          setDialogOpen(false);
          setNewName('');
          speak('Diálogo cerrado');
        }}
        aria-labelledby="navbar-dialog-title"
        aria-describedby="navbar-dialog-description"
        disableRestoreFocus
        PaperProps={{
          sx: {
            backgroundColor: '#f5f5f5',
            color: '#000000',
            border: '1px solid #ddd'
          }
        }}
      >
        <DialogTitle 
          id="navbar-dialog-title" 
          sx={{ color: '#000000' }}
          tabIndex={-1}
        >
          Crear Nuevo Archivo
        </DialogTitle>
        <DialogContent>
          <DialogContentText 
            id="navbar-dialog-description"
            sx={{ color: '#666666', mb: 2 }}
            tabIndex={-1}
          >
            Ingresa el nombre para el archivo. Solo se permiten extensiones .txt o .py.
            Si no escribes extensión, se usará .txt por defecto.
          </DialogContentText>
          <TextField
            inputRef={createDialogInputRef}
            margin="dense"
            label="Nombre del archivo"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={handleDialogChange}
            onKeyDown={(e) => {
              handleDialogKeyDown(e);
              if (e.key === 'Enter') {
                e.preventDefault();
                handleDialogConfirm();
              }
            }}
            onFocus={() => {
              speakOnFocus(`Campo de nombre para archivo. ${newName ? `Nombre actual: ${newName}` : 'Campo vacío'}. Escribe el nombre y presiona Enter para crear. Solo extensiones .txt o .py`);
            }}
            onBlur={() => {
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
            }}
            aria-label="Nombre del archivo"
            aria-describedby="navbar-dialog-description"
            placeholder="ejemplo.py o ejemplo.txt"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#000000',
                '& fieldset': {
                  borderColor: '#ddd'
                },
                '&:hover fieldset': {
                  borderColor: '#1976d2'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2'
                }
              },
              '& .MuiInputLabel-root': {
                color: '#666666',
                '&.Mui-focused': {
                  color: '#1976d2'
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
            sx={{ color: '#666666' }}
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
            onFocus={() => speakOnFocus('Botón crear archivo. Presiona Enter para confirmar')}
            onMouseEnter={() => speakOnHover('Crear')}
            onMouseLeave={cancelHoverSpeak}
            variant="contained"
            disabled={!newName.trim()}
            sx={{
              backgroundColor: '#1976d2',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#1976d2',
                filter: 'brightness(0.9)'
              },
              '&.Mui-disabled': {
                backgroundColor: '#666666',
                opacity: 0.5
              }
            }}
          >
            Crear
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
            backgroundColor: '#f5f5f5',
            color: '#000000',
            border: '2px solid #ed6c02'
          }
        }}
      >
        <DialogTitle 
          id="storage-warning-title" 
          sx={{ color: '#ed6c02', display: 'flex', alignItems: 'center' }}
          tabIndex={-1}
        >
          ⚠️ Advertencia
        </DialogTitle>
        <DialogContent>
          <DialogContentText 
            id="storage-warning-description"
            sx={{ color: '#000000' }}
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
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1976d2',
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
            backgroundColor: '#f5f5f5',
            color: '#000000',
            border: '2px solid #d32f2f'
          }
        }}
      >
        <DialogTitle 
          id="extension-error-title" 
          sx={{ color: '#d32f2f', display: 'flex', alignItems: 'center' }}
          tabIndex={-1}
        >
          ❌ Extensión no permitida
        </DialogTitle>
        <DialogContent>
          <DialogContentText 
            id="extension-error-description"
            sx={{ color: '#000000' }}
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
              // Volver a enfocar el input
              setTimeout(() => {
                if (createDialogInputRef.current) {
                  createDialogInputRef.current.focus();
                }
              }, 100);
            }}
            onFocus={() => speakOnFocus('Botón entendido. Presiona Enter para cerrar y corregir el nombre')}
            onMouseEnter={() => speakOnHover('Entendido')}
            onMouseLeave={cancelHoverSpeak}
            variant="contained"
            autoFocus
            sx={{ 
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1976d2',
                filter: 'brightness(0.9)'
              }
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default Navbar;