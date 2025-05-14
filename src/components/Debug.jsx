import React, { useState } from 'react';
import { Box, TextField, Button, Grid } from '@mui/material';

function Debug({ contrast, onDebug }) {
  const [startLine, setStartLine] = useState('');
  const [endLine, setEndLine] = useState('');

  const handleDebug = () => {
    onDebug(startLine, endLine);
  };

  return (
    <Box sx={{ overflow: 'auto' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Línea de inicio"
            value={startLine}
            onChange={(e) => setStartLine(e.target.value)}
            variant="outlined"
            margin="normal"
            fullWidth
            inputProps={{ 'aria-label': 'Línea de inicio' }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Línea de fin"
            value={endLine}
            onChange={(e) => setEndLine(e.target.value)}
            variant="outlined"
            margin="normal"
            fullWidth
            inputProps={{ 'aria-label': 'Línea de fin' }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button variant="contained" color="primary" onClick={handleDebug} aria-label="Iniciar depuración" fullWidth>
            Iniciar depuración
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Debug;