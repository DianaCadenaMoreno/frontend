import React from 'react';
import { Box } from '@mui/material';

function Terminal({ debug, contrast, output }) {
  const terminalStyle = {
    bgcolor: debug ? (contrast === 'high-contrast' ? '#1e1e1e' : '#e0e0e0') : (contrast === 'high-contrast' ? '#1e1e1e' : '#ffffff'),
    color: debug ? (contrast === 'high-contrast' ? '#ffffff' : '#1e1e1e') : (contrast === 'high-contrast' ? '#ffffff' : '#1e1e1e'), 
    height: '20vh',
    padding: 2,
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
  };

  return (
    <Box sx={terminalStyle}>
      {/* {debug ? "Consola de depuracion" : "Terminal"} */}
      {output ? (
        output.stderr === '' ? (
          <>
            <div>{output.stdout}</div>
          </>
        ) : (
          <>
            <div>{output.stderr}</div>
            <div><strong>returncode:</strong> {output.returncode}</div>
          </>
        )
      ) : (
        <div>{debug ? "Consola de depuración" : "Terminal"}</div>
      )}
    </Box>
  );
}

export default Terminal;
