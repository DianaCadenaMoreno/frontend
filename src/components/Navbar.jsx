import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Popover,
  Button,
  Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AdbIcon from '@mui/icons-material/Adb';

const menuItems = {
  archivos: ['Nuevo archivo de texto', 'Nuevo archivo', 'Abrir un archivo', 'Abrir una carpeta'],
  ajustes: ['Paleta de comandos', 'Apariencia', 'Editor de layout', 'Consola de Debug'],
  ayuda: ['Bienvenida', 'Ver todos los comandos', 'Documentación', 'Manual de usuario'],
};

function Navbar({ onOpenAppearanceModal }) {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElArchivos, setAnchorElArchivos] = React.useState(null);
  const [anchorElAjustes, setAnchorElAjustes] = React.useState(null);
  const [anchorElAyuda, setAnchorElAyuda] = React.useState(null);

  const handleMenuOpen = (setter) => (event) => setter(event.currentTarget);
  const handleMenuClose = (setter) => () => setter(null);

  return (
    <AppBar position="static" sx={{ bgcolor: '#101B23' }}>
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

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="open navigation menu"
              onClick={handleMenuOpen(setAnchorElNav)}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Popover
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              open={Boolean(anchorElNav)}
              onClose={handleMenuClose(setAnchorElNav)}
              sx={{ mt: '45px',
                '& .MuiPaper-root': {
                  backgroundColor: '#101B23',
                }
               }}
            >
              {Object.keys(menuItems).map((key) => (
                <Button
                  key={key}
                  onClick={handleMenuClose(setAnchorElNav)}
                  sx={{ color:'white', width: '100%', justifyContent: 'flex-start' }}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Button>
              ))}
            </Popover>
          </Box>

          <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Code Flow
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {Object.entries(menuItems).map(([key, items]) => (
              <React.Fragment key={key}>
                <Button onClick={handleMenuOpen(key === 'archivos' ? setAnchorElArchivos : key === 'ajustes' ? setAnchorElAjustes : setAnchorElAyuda)} sx={{ my: 2, color: 'white' }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Button>
                <Popover
                  sx={{ mt: '45px',
                    '& .MuiPaper-root': {
                      backgroundColor: '#101B23',
                    }
                   }}
                  id={`menu-appbar-${key}`}
                  anchorEl={key === 'archivos' ? anchorElArchivos : key === 'ajustes' ? anchorElAjustes : anchorElAyuda}
                  anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  open={Boolean(key === 'archivos' ? anchorElArchivos : key === 'ajustes' ? anchorElAjustes : anchorElAyuda)}
                  onClose={handleMenuClose(key === 'archivos' ? setAnchorElArchivos : key === 'ajustes' ? setAnchorElAjustes : setAnchorElAyuda)}
                >
                  {items.map((item) => (
                    <Button
                      key={item}
                      onClick={item === 'Apariencia' ? onOpenAppearanceModal : handleMenuClose(key === 'archivos' ? setAnchorElArchivos : setAnchorElAyuda)}
                      sx={{color:'white', width: '100%', justifyContent: 'flex-start' }}
                    >
                      {item}
                    </Button>
                  ))}
                </Popover>
              </React.Fragment>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;