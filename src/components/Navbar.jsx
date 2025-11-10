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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAppNavigation } from '../contexts/NavigationContext';
import { useScreenReader } from '../contexts/ScreenReaderContext';

const menuItems = {
  archivos: ['Nuevo archivo de texto', 'Nuevo archivo', 'Abrir un archivo', 'Abrir una carpeta'],
  ajustes: ['Paleta de comandos', 'Apariencia', 'Editor de layout', 'Consola de Debug'],
  ayuda: ['Bienvenida', 'Ver todos los comandos', 'Documentación', 'Manual de usuario'],
};

const Navbar = React.forwardRef(({ onOpenAppearanceModal }, ref) => {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElArchivos, setAnchorElArchivos] = React.useState(null);
  const [anchorElAjustes, setAnchorElAjustes] = React.useState(null);
  const [anchorElAyuda, setAnchorElAyuda] = React.useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMenu, setSelectedMenu] = useState('archivos');
  const [focusedMenuItem, setFocusedMenuItem] = useState(0);
  
  const { registerComponent, unregisterComponent, setFocusedComponent } = useAppNavigation();
  const { speak, speakOnHover, speakOnFocus, cancelHoverSpeak } = useScreenReader();
  
  const navbarRef = useRef(null);
  const menuRefs = useRef({});

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
        setAnchorElArchivos(navbarRef.current);
        setSelectedMenu('archivos');
        setFocusedMenuItem(0);
        speak('Menú archivos abierto. 4 opciones disponibles. Usa las flechas arriba y abajo para navegar.');
      },
      openAjustesMenu: () => {
        setAnchorElAjustes(navbarRef.current);
        setSelectedMenu('ajustes');
        setFocusedMenuItem(0);
        speak('Menú ajustes abierto. 4 opciones disponibles. Usa las flechas arriba y abajo para navegar.');
      },
      openAyudaMenu: () => {
        setAnchorElAyuda(navbarRef.current);
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

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (navbarRef.current) {
        navbarRef.current.focus();
      }
    },
    openArchivosMenu: () => {
      setAnchorElArchivos(navbarRef.current);
      setSelectedMenu('archivos');
      setFocusedMenuItem(0);
    },
  }));

  const handleMenuOpen = (setter, menuName) => {
    setter(navbarRef.current);
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
            if (nextMenu === 'archivos') handleMenuOpen(setAnchorElArchivos, 'archivos');
            else if (nextMenu === 'ajustes') handleMenuOpen(setAnchorElAjustes, 'ajustes');
            else handleMenuOpen(setAnchorElAyuda, 'ayuda');
          }, 100);
          break;
          
        case 'ArrowLeft':
          event.preventDefault();
          const menuKeys2 = Object.keys(menuItems);
          const prevMenuIndex = (menuKeys2.indexOf(selectedMenu) - 1 + menuKeys2.length) % menuKeys2.length;
          const prevMenu = menuKeys2[prevMenuIndex];
          
          handleMenuClose(getCurrentSetter());
          setTimeout(() => {
            if (prevMenu === 'archivos') handleMenuOpen(setAnchorElArchivos, 'archivos');
            else if (prevMenu === 'ajustes') handleMenuOpen(setAnchorElAjustes, 'ajustes');
            else handleMenuOpen(setAnchorElAyuda, 'ayuda');
          }, 100);
          break;
          
        case 'Enter':
        case ' ':
          event.preventDefault();
          const selectedItem = currentMenuItems[focusedMenuItem];
          speak(`Seleccionado: ${selectedItem}`);
          
          if (selectedItem === 'Apariencia') {
            onOpenAppearanceModal();
          }
          
          handleMenuClose(getCurrentSetter());
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
          if (selectedMenu === 'archivos') handleMenuOpen(setAnchorElArchivos, 'archivos');
          else if (selectedMenu === 'ajustes') handleMenuOpen(setAnchorElAjustes, 'ajustes');
          else handleMenuOpen(setAnchorElAyuda, 'ayuda');
          break;
          
        default:
          break;
      }
    }
  };

  return (
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
        <Box
          component="img"
          src="/logo_white.png"
          alt="Code Flow Logo"
          sx={{
            display: { xs: 'none', md: 'flex' },
            mr: 2,
            height: 40,
            width: 'auto',
          }}
        />
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            mr: 2,
            display: { xs: 'none', md: 'flex' },
            fontFamily: 'sans-serif',
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'underline',
          }}
        >
          Code Flow
        </Typography>

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
                  onClick={() => handleMenuOpen(setter, key)}
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
                    mt: '45px',
                    '& .MuiPaper-root': {
                      backgroundColor: '#101B23',
                    }
                  }}
                  id={`menu-appbar-${key}`}
                  anchorEl={anchorEl}
                  anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
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
                          if (item === 'Apariencia') {
                            onOpenAppearanceModal();
                          }
                          handleMenuClose(setter);
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
  );
});

export default Navbar;