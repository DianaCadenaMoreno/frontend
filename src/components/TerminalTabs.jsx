import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import Terminal from './Terminal';

function TerminalTabs({ contrast, output }) { 
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ bgcolor: contrast === 'high-contrast' ? '#1e1e1e' : '#f0f0f0', height: '100%' }}>
      <Tabs value={value} onChange={handleChange} aria-label="terminal tabs" textColor={contrast === 'high-contrast' ? 'inherit' : 'primary'}>
        <Tab label="Terminal" />
        <Tab label="Depurar" />
      </Tabs>
      <Box sx={{ padding: 1, bgcolor: contrast === 'high-contrast' ? '#1e1e1e' : '#d3d3d3', height: 'calc(100% - 48px)' }}>
        {value === 0 && <Terminal contrast={contrast} output={output}/>} 
        {value === 1 && <Terminal debug contrast={contrast} />} 
      </Box>
    </Box>
  );
}

export default TerminalTabs;
