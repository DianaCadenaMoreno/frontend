import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Breadcrumbs, Link, Button, CircularProgress } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Editor from '@monaco-editor/react';
import axiosInstance from '../utils/axiosInstance';

function handleClick(event) {
  event.preventDefault();
  console.info('You clicked a breadcrumb.');
}

const TextEditor = React.forwardRef(({ contrast, setOutput, setCodeStructure, editorContent, setEditorContent }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // Función para activar el foco en el editor
  React.useImperativeHandle(ref, () => ({
    focusEditor: () => {
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          const lastLine = model.getLineCount();
          const lastColumn = model.getLineMaxColumn(lastLine);
          editorRef.current.setPosition({ lineNumber: lastLine, column: lastColumn });
        }
        editorRef.current.focus();
      }
    },
  }));

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

  const handleAnalyzeStructure = async (code) => {
    try {
      const response = await axiosInstance.post('structure/', { code });
      setCodeStructure(response.data.structure || []);
    } catch (error) {
      console.error('Error analyzing code structure:', error);
    }
  };

  const handleEditorChange = (value) => {
    setEditorContent(value);
    handleAnalyzeStructure(value);

    if (value && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(value);
      utterance.onerror = (e) => console.error('Speech synthesis error:', e);
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis not supported in this browser.');
    }
  };

  const handleSendFile = async () => {
    setIsLoading(true);
    const blob = new Blob([editorContent], { type: 'text/x-python' });
    const formData = new FormData();
    formData.append('file', blob, 'code.py');
    console.log(formData);
    try {
      const response = await axiosInstance.post('run/', formData);
      const result = response.data;
      setIsLoading(false);
      console.log(result);
      setOutput(result);
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsLoading(false);
    }
  };

  return (
    <Box ref={ref}>
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
        <Button variant="contained" color="success" onClick={handleSendFile} aria-label="Ejecutar archivo">
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Ejecutar'}
        </Button>
      </Box>
      <Editor
        height="260px"
        defaultLanguage="python"
        defaultValue="Presiona CTRL+I para preguntarle al copiloto //Comienza a escribir para ignorar..."
        onChange={(value) => { setEditorContent(value); handleEditorChange(value); }}
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
        onMount={(editor) => {
          editorRef.current = editor;}}
      />
    </Box>
  );
});

export default TextEditor;