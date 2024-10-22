// src/components/TextEditor.jsx
import React, { useState } from 'react';
import { Box, Typography, Breadcrumbs, Link, Button, CircularProgress } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Editor from '@monaco-editor/react';
import Terminal from './Terminal';

function handleClick(event) {
  event.preventDefault();
  console.info('You clicked a breadcrumb.');
}

function TextEditor({ contrast, setOutput }) {
  const [editorContent, setEditorContent] = useState(''); // Estado para almacenar el contenido del editor
  const [isLoading, setIsLoading] = useState(false);

  const breadcrumbs = [
    <Link underline="hover" key="1" color={contrast === 'high-contrast' ? '#fff' : 'inherit'} href="/" onClick={handleClick}>
      MUI
    </Link>,
    <Link
      underline="hover"
      key="2"
      color={contrast === 'high-contrast' ? '#fff' : 'inherit'}
      href="/material-ui/getting-started/installation/"
      onClick={handleClick}
    >
      Core
    </Link>,
    <Typography key="3" color={contrast === 'high-contrast' ? '#fff' : 'text.primary'}>
      Breadcrumb
    </Typography>,
  ];

  // Función para manejar el envío del archivo .py
  const handleSendFile = async () => {
    setIsLoading(true);
    const blob = new Blob([editorContent], { type: 'text/x-python' }); // Crear un archivo .py a partir del contenido
    const formData = new FormData();
    formData.append('file', blob, 'code.py'); // Agregar archivo al FormData
    console.log(formData)
    try {
      const response = await fetch('http://127.0.0.1:8000/api/run/', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      setIsLoading(false)
      console.log(result); // Mostrar el resultado de la ejecución en consola
      setOutput(result); // Actualizar el estado de la salida
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        style={{
          paddingLeft: '15px',
          paddingRight: '15px',
          color: contrast === 'high-contrast' ? '#fff' : '#000',
        }}
      >
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          {breadcrumbs}
        </Breadcrumbs>
        {/* Botón para enviar el contenido del editor como archivo .py */}
        <Button variant="contained" color="success" onClick={handleSendFile}>
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'RUN'}
        </Button>
      </Box>
      <Editor
        height="260px"
        defaultLanguage="python"
        defaultValue="Presiona CTRL+I para preguntarle a Github Copilot //Comienza a escribir para ignorar..."
        onChange={(value) => setEditorContent(value)} // Actualiza el estado cuando cambia el contenido del editor
        options={{
          selectOnLineNumbers: true,
          minimap: { enabled: false },
          scrollbar: { vertical: 'auto', horizontal: 'auto' },
          lineNumbers: 'on',
          renderLineHighlight: 'none',
          padding: { top: 10, bottom: 10 },
          border: 'none',
        }}
        theme={contrast === 'high-contrast' ? 'vs-dark' : 'vs-light'}
      />
    </Box>
  );
}

export default TextEditor;
