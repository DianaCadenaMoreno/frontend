import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import Terminal from './Terminal';
import Debug from './Debug';

function TerminalTabs({ contrast, output, pid, onDebug }) { 
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  console.log("pid desde terminal tabs", pid);
  return (
    <Box sx={{ bgcolor: contrast === 'high-contrast' ? '#1e1e1e' : '#f0f0f0',
      // flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      //minHeight: 0}}>
    }}>
      <Tabs value={value} onChange={handleChange} aria-label="terminal tabs" textColor={contrast === 'high-contrast' ? 'inherit' : 'primary'}>
        <Tab label="Terminal" />
        <Tab label="Depurar" />
      </Tabs>
      <Box 
        sx= {{ padding: 1, 
              bgcolor: contrast === 'high-contrast' ? '#1e1e1e' : '#d3d3d3',
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column'
            }}>
        {value === 0 && <Terminal contrast={contrast} output={output} pid={pid}/>} 
        {value === 1 && <Debug debug contrast={contrast} onDebug={onDebug}/>} 
      </Box>
    </Box>
  );
}

export default TerminalTabs;
