import React from 'react';
import { Box, Tabs, Tab, IconButton } from '@mui/material';
import Terminal from './Terminal';
import Debug from './Debug';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function TerminalTabs({ contrast, output, pid, onDebug, collapsed, onToggleCollapse, textEditorRef, ...props }) { 
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

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
            value={value} 
            onChange={handleChange} 
            aria-label="terminal tabs" 
            textColor={contrast === 'high-contrast' ? 'inherit' : 'primary'}
            sx={{ flex: 1 }}
          >
            <Tab label="Terminal" />
            <Tab label="Depurar" />
          </Tabs>
        )}
        
        <IconButton 
          onClick={onToggleCollapse}
          size="small"
          aria-label={collapsed ? "Expandir terminal" : "Colapsar terminal"}
          sx={{ 
            ml: collapsed ? 0 : 1,
            mr: 1,
            color: contrast === 'high-contrast' ? '#fff' : 'inherit'
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

      {/* Vista colapsada - mostrar solo una línea con información básica */}
      {collapsed && (
        <Box sx={{ 
          p: 1, 
          bgcolor: contrast === 'high-contrast' ? '#000000' : '#d3d3d3',
          color: contrast === 'high-contrast' ? '#fff' : '#000',
          fontSize: '0.75rem',
          textAlign: 'center'
        }}>
          {/* {value === 0 ? 'Terminal listo' : 'Depurador listo'} */}
        </Box>
      )}
    </Box>
  );
}

export default TerminalTabs;