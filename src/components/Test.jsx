import React, { useImperativeHandle, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  Popover,
} from '@mui/material';
import AdbIcon from '@mui/icons-material/Adb';

const menuItems = {
  archivos: ['Nuevo archivo de texto', 'Nuevo archivo', 'Abrir un archivo', 'Abrir una carpeta'],
  ajustes: ['Paleta de comandos', 'Apariencia', 'Editor de layout', 'Consola de Debug'],
  ayuda: ['Bienvenida', 'Ver todos los comandos', 'Documentación', 'Manual de usuario'],
};

const Navbar = React.forwardRef(({ onOpenAppearanceModal }, ref) => {
  const [anchorElArchivos, setAnchorElArchivos] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0); // Índice de navegación

  // Función para abrir el menú
  useImperativeHandle(ref, () => ({
    openArchivosMenu: (event) => {
      setAnchorElArchivos(event.currentTarget);
      setSelectedIndex(0); // Reiniciar la selección
    },
  }));

  // Manejo de teclas para navegación
  const handleKeyDown = (event) => {
    if (!anchorElArchivos) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % menuItems.archivos.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + menuItems.archivos.length) % menuItems.archivos.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      console.log(`Seleccionado: ${menuItems.archivos[selectedIndex]}`);
      setAnchorElArchivos(null);
    }
  };

  return (
    <AppBar position="static" sx={{ bgcolor: '#101B23' }} ref={ref} onKeyDown={handleKeyDown}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
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

          {/* Botón Archivos */}
          <Button onClick={(event) => setAnchorElArchivos(event.currentTarget)} sx={{ my: 2, color: 'white' }}>
            Archivos
          </Button>

          {/* Menú desplegable */}
          <Popover
            sx={{ mt: '45px', '& .MuiPaper-root': { backgroundColor: '#101B23' } }}
            anchorEl={anchorElArchivos}
            open={Boolean(anchorElArchivos)}
            onClose={() => setAnchorElArchivos(null)}
          >
            {menuItems.archivos.map((item, index) => (
              <Button
                key={item}
                onClick={() => console.log(`Seleccionado: ${item}`)}
                sx={{
                  color: 'white',
                  width: '100%',
                  justifyContent: 'flex-start',
                  backgroundColor: selectedIndex === index ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                }}
                tabIndex={0}
                autoFocus={selectedIndex === index}
              >
                {item}
              </Button>
            ))}
          </Popover>
        </Toolbar>
      </Container>
    </AppBar>
  );
});

export default Navbar;
