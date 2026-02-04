import React, { useRef, useEffect } from 'react';
import { Box, Tabs, Tab, IconButton } from '@mui/material';
import Terminal from './Terminal';
import Debug from './Debug';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAppNavigation } from '../contexts/NavigationContext';
import { useScreenReader } from '../contexts/ScreenReaderContext';

function TerminalTabs({ contrast, output, pid, onDebug, collapsed, onToggleCollapse, textEditorRef, ...props }) { 
  const [value, setValue] = React.useState(0);
  const tabsRef = useRef(null);
  const { registerComponent, unregisterComponent } = useAppNavigation();
  const { speak } = useScreenReader();

  const handleChange = (event, newValue) => {
    setValue(newValue);
    speak(newValue === 0 ? 'Terminal seleccionada' : 'Depurador seleccionado');
  };

  // Registrar componente en el sistema de navegación
  useEffect(() => {
    const terminalTabsAPI = {
      focus: () => {
        if (tabsRef.current) {
          tabsRef.current.focus();
          speak(`Panel de terminal y depurador. Pestaña ${value === 0 ? 'Terminal' : 'Depurador'} activa. Usa las flechas para cambiar de pestaña`);
        }
      },
      switchToTerminal: () => {
        setValue(0);
        if (tabsRef.current) {
          tabsRef.current.focus();
          speak('Terminal seleccionada');
        }
      },
      switchToDebug: () => {
        setValue(1);
        if (tabsRef.current) {
          tabsRef.current.focus();
          speak('Depurador seleccionado');
        }
      }
    };

    registerComponent('terminal-tabs', terminalTabsAPI);
    registerComponent('terminal', terminalTabsAPI); // Alias para Alt+4

    return () => {
      unregisterComponent('terminal-tabs');
      unregisterComponent('terminal');
    };
  }, [registerComponent, unregisterComponent, speak, value]);

  return (
    <Box 
      sx={{ 
        bgcolor: contrast === 'high-contrast' ? '#1e1e1e' : '#f0f0f0',
        display: 'flex', 
        flexDirection: 'column',
        height: collapsed ? 'auto' : '100%',
        minHeight: collapsed ? '50px' : '150px',
        overflow: 'hidden',
        transition: 'height 0.3s ease'
      }}
      {...props}
    >
      {/* Header con tabs y botón de colapso */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexShrink: 0,
        borderBottom: collapsed ? 0 : 1,
        borderColor: 'divider'
      }}>
        {!collapsed && (
          <Tabs 
            ref={tabsRef}
            value={value} 
            onChange={handleChange} 
            aria-label="Terminal y depurador" 
            textColor={contrast === 'high-contrast' ? 'inherit' : 'primary'}
            sx={{ 
              flex: 1,
              '& .MuiTab-root:focus': {
                outline: '2px solid',
                outlineColor: contrast === 'high-contrast' ? '#fff' : '#1976d2',
                outlineOffset: '-2px'
              }
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' && value === 1) {
                e.preventDefault();
                handleChange(e, 0);
              } else if (e.key === 'ArrowRight' && value === 0) {
                e.preventDefault();
                handleChange(e, 1);
              }
            }}
          >
            <Tab 
              label="Terminal" 
              aria-label="Pestaña de terminal"
              onFocus={() => speak('Pestaña Terminal')}
            />
            <Tab 
              label="Depurar" 
              aria-label="Pestaña de depurador"
              onFocus={() => speak('Pestaña Depurador')}
            />
          </Tabs>
        )}
        
        <IconButton 
          onClick={onToggleCollapse}
          size="small"
          aria-label={collapsed ? "Expandir terminal" : "Colapsar terminal"}
          onFocus={() => speak(collapsed ? "Expandir terminal" : "Colapsar terminal")}
          sx={{ 
            ml: collapsed ? 0 : 1,
            mr: 1,
            color: contrast === 'high-contrast' ? '#fff' : 'inherit',
            '&:focus': {
              outline: '2px solid',
              outlineColor: contrast === 'high-contrast' ? '#fff' : '#1976d2'
            }
          }}
        >
          {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
      </Box>

      {/* Contenido */}
      {!collapsed && (
        <Box sx={{ 
          padding: 1, 
          bgcolor: contrast === 'high-contrast' ? '#000000' : '#d3d3d3',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {value === 0 && <Terminal contrast={contrast} output={output} pid={pid} textEditorRef={textEditorRef}/>} 
          {value === 1 && <Debug debug contrast={contrast} textEditorRef={textEditorRef} onDebug={onDebug}/>} 
        </Box>
      )}

      {/* Vista colapsada */}
      {collapsed && (
        <Box sx={{ 
          p: 1, 
          bgcolor: contrast === 'high-contrast' ? '#000000' : '#d3d3d3',
          color: contrast === 'high-contrast' ? '#fff' : '#000',
          fontSize: '0.75rem',
          textAlign: 'center'
        }}>
          {/* Contenido colapsado */}
        </Box>
      )}
    </Box>
  );
}

export default TerminalTabs;