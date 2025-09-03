import React from 'react';
import Split from 'react-split';
import { Box, Tabs, Tab, Typography, TextField, IconButton, CircularProgress, Button, Collapse, Menu, MenuItem, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, List, ListItem, ListItemText, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import { InsertDriveFile } from '@mui/icons-material';
import { CreateNewFolder } from '@mui/icons-material';
import { Folder } from '@mui/icons-material';
import { FolderOpen } from '@mui/icons-material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import generateCode from '../utils/chat';
import useSpeechRecognition from '../utils/speech';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/FileManager.css'

function FileManager({ contrast, codeStructure, onFileOpen, collapsed, onToggleCollapse, ...props }) {
  const [files, setFiles] = React.useState(() => JSON.parse(localStorage.getItem('files')) || []);
  const [folders, setFolders] = React.useState(() => JSON.parse(localStorage.getItem('folders')) || []);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [tabIndex, setTabIndex] = React.useState(0);
  const [prompt, setPrompt] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [isFile, setIsFile] = React.useState(true);
  const [openFolders, setOpenFolders] = React.useState({});
  const [chatHistory, setChatHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const { isListening, transcript, setIsListening } = useSpeechRecognition();
  const [isCodeStructureOpen, setIsCodeStructureOpen] = React.useState(true);

  React.useEffect(() => {
    if (transcript) {
      setPrompt(transcript);
    }
  }, [transcript]);
  
  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  React.useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (lastMessage.role === 'assistant' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(lastMessage.content);
        utterance.lang = 'es-ES';
        utterance.rate = 1.2;
        utterance.onerror = (e) => console.error('Speech synthesis error:', e);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [chatHistory]);

  // Auto-abrir estructura del código cuando hay contenido
  React.useEffect(() => {
    if (codeStructure && codeStructure.length > 0) {
      setIsCodeStructureOpen(true);
    }
  }, [codeStructure]);

  const handleGenerateCode = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    const newChatHistory = [...chatHistory, { role: 'user', content: prompt }];
    setChatHistory(newChatHistory);
    
    try {
      await generateCode(prompt, (response) => {
        setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
      }, setLoading);
    } catch (error) {
      console.error('Error generating code:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al generar el código.' }]);
    }
    
    setPrompt('');
    setLoading(false);
  };

  const handleCreateFile = () => {
    setIsFile(true);
    setNewName('');
    setDialogOpen(true);
  };

  const handleCreateFolder = () => {
    setIsFile(false);
    setNewName('');
    setDialogOpen(true);
  };

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.py,.js,.jsx,.ts,.tsx,.txt,.md,.json,.html,.css';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newFile = {
            id: Date.now(),
            name: file.name,
            content: event.target.result,
            type: 'file'
          };
          setFiles(prev => [...prev, newFile]);
          onFileOpen(newFile.name, event.target.result);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleOpenFolder = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      const folderName = files[0]?.webkitRelativePath.split('/')[0] || 'Nueva Carpeta';
      
      const newFolder = {
        id: Date.now(),
        name: folderName,
        files: files.map(file => ({
          id: Date.now() + Math.random(),
          name: file.name,
          path: file.webkitRelativePath,
          content: '', // Aquí podrías leer el contenido si es necesario
          type: 'file'
        })),
        type: 'folder'
      };
      
      setFolders(prev => [...prev, newFolder]);
    };
    input.click();
  };

  const handleDialogConfirm = () => {
    if (!newName.trim()) return;
    
    if (isFile) {
      const newFile = {
        id: Date.now(),
        name: newName.includes('.') ? newName : `${newName}.txt`,
        content: '',
        type: 'file'
      };
      setFiles(prev => [...prev, newFile]);
      onFileOpen(newFile.name, '');
    } else {
      const newFolder = {
        id: Date.now(),
        name: newName,
        files: [],
        type: 'folder'
      };
      setFolders(prev => [...prev, newFolder]);
    }
    
    setDialogOpen(false);
    setNewName('');
  };

  const handleFileClick = (file) => {
    onFileOpen(file.name, file.content || '');
  };

  const toggleFolder = (folderId) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const updatedChatHistory = chatHistory.map(message => ({
    ...message,
    content: message.content.replace(/'/g, '"')
  }));

  const ChatHistory = ({ chatHistory, contrast }) => (
    <div>
      {updatedChatHistory.map((message, index) => (
        <div key={index} style={{ marginBottom: "10px" }}>
          <Typography style={{ color: contrast === "high-contrast" ? "#fff" : "#000" }}>
            <strong>{message.role === "user" ? "Tú: " : "Copiloto: "}</strong>
          </Typography>
          <ReactMarkdown
            children={message.content}
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <Typography
                  {...props}
                  style={{ color: contrast === "high-contrast" ? "#fff" : "#000", marginBottom: "10px" }}
                />
              ),
              code: ({ node, inline, className, children, ...props }) => (
                <div style={{ position: "relative" }}>
                  <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                    <code {...props}>{children}</code>
                  </pre>
                  <CopyToClipboard text={children}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      style={{ position: "absolute", top: 0, right: 0 }}
                    >
                      Copiar
                    </Button>
                  </CopyToClipboard>
                </div>
              ),
            }}
          />
        </div>
      ))}
    </div>
  );

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
    }
  };

  React.useEffect(() => {
    localStorage.setItem('files', JSON.stringify(files));
  }, [files]);

  React.useEffect(() => {
    localStorage.setItem('folders', JSON.stringify(folders));
  }, [folders]);

  // Verificar si hay contenido en la estructura del código
  const hasCodeStructure = codeStructure && codeStructure.length > 0;

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        width: collapsed ? '50px' : '100%',
        minWidth: collapsed ? '50px' : '200px',
        backgroundColor: contrast === 'high-contrast' ? '#1e1e1e' : 'inherit',
        color: contrast === 'high-contrast' ? '#fff' : 'inherit',
        overflow: 'hidden',
        transition: 'width 0.3s ease'
      }}
      {...props}
    >
      {/* Header con botón de colapso */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 1,
        borderBottom: 1,
        borderColor: 'divider',
        flexShrink: 0
      }}>
        {!collapsed && (
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange} 
            aria-label="File Manager Tabs"
            textColor={contrast === 'high-contrast' ? 'inherit' : 'primary'}
            indicatorColor={'primary'}
            sx={{ flex: 1 }}
          >
            <Tab label="Archivos" />
            <Tab label="Chat" />
          </Tabs>
        )}
        <IconButton 
          onClick={onToggleCollapse}
          size="small"
          aria-label={collapsed ? "Expandir panel" : "Colapsar panel"}
          sx={{ 
            ml: collapsed ? 0 : 1,
            color: contrast === 'high-contrast' ? '#fff' : 'inherit'
          }}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* Contenido */}
      {!collapsed && (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Contenido de Chat */}
          {tabIndex === 1 && (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              minHeight: 0
            }}>
              <Box sx={{ 
                flexGrow: 1, 
                overflowY: 'auto', 
                mb: 2, 
                padding: 2,
                minHeight: 0
              }}>
                <Typography variant="h6" component="h2" aria-live="polite">
                  Bienvenido a tu copiloto, estoy aquí para ayudarte a hacer las cosas más rápido.
                </Typography>
                {loading ? (
                  <CircularProgress color={contrast === 'high-contrast' ? 'inherit' : 'primary'}/>
                ) : (
                  <ChatHistory chatHistory={chatHistory} contrast={contrast} /> 
                )}
              </Box>
              
              <Box sx={{ 
                padding: 2, 
                borderTop: 1, 
                borderColor: 'divider',
                flexShrink: 0
              }}>
                <TextField
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Escribe o pregunta algo a tu copiloto..."
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  aria-label="Descripción del código"
                  InputProps={{
                    style: { color: contrast === 'high-contrast' ? '#fff' : '#000' },
                    endAdornment: (
                      <>
                        <IconButton onClick={handleMicClick} color={isListening ? "error" : contrast === 'high-contrast' ? "inherit" : "primary"}>
                          <MicIcon />
                        </IconButton>
                        <IconButton onClick={handleGenerateCode} color={contrast === 'high-contrast' ? "inherit" : "primary"}>
                          <SendIcon />
                        </IconButton>
                      </>
                    ),
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Contenido de Archivos con Split Vertical */}
          {tabIndex === 0 && (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden'
            }}>
              {hasCodeStructure ? (
                <Split
                  direction="vertical"
                  sizes={isCodeStructureOpen ? [60, 40] : [90, 10]}
                  minSize={[150, 50]}
                  maxSize={[undefined, undefined]}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: 0
                  }}
                  className="split-vertical-filemanager"
                >
                  {/* Panel superior: Archivos y opciones */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                    p: 1
                  }}>
                    {/* Botones de acción en filas */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 1, 
                      mb: 2
                    }}>
                      {/* Primera fila */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Crear nuevo archivo">
                          <Button
                            onClick={handleCreateFile}
                            size="small"
                            startIcon={<NoteAddIcon />}
                            variant="outlined"
                            fullWidth
                            sx={{ 
                              color: contrast === 'high-contrast' ? '#fff' : 'inherit',
                              borderColor: contrast === 'high-contrast' ? '#fff' : 'inherit'
                            }}
                          >
                            Nuevo Archivo
                          </Button>
                        </Tooltip>
                        <Tooltip title="Crear nueva carpeta">
                          <Button
                            onClick={handleCreateFolder}
                            size="small"
                            startIcon={<CreateNewFolder />}
                            variant="outlined"
                            fullWidth
                            sx={{ 
                              color: contrast === 'high-contrast' ? '#fff' : 'inherit',
                              borderColor: contrast === 'high-contrast' ? '#fff' : 'inherit'
                            }}
                          >
                            Nueva Carpeta
                          </Button>
                        </Tooltip>
                      </Box>

                      {/* Segunda fila */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Abrir archivo desde el sistema">
                          <Button
                            onClick={handleOpenFile}
                            size="small"
                            startIcon={<FolderOpenIcon />}
                            variant="outlined"
                            fullWidth
                            sx={{ 
                              color: contrast === 'high-contrast' ? '#fff' : 'inherit',
                              borderColor: contrast === 'high-contrast' ? '#fff' : 'inherit'
                            }}
                          >
                            Abrir Archivo
                          </Button>
                        </Tooltip>
                        <Tooltip title="Abrir carpeta desde el sistema">
                          <Button
                            onClick={handleOpenFolder}
                            size="small"
                            startIcon={<FolderOpen />}
                            variant="outlined"
                            fullWidth
                            sx={{ 
                              color: contrast === 'high-contrast' ? '#fff' : 'inherit',
                              borderColor: contrast === 'high-contrast' ? '#fff' : 'inherit'
                            }}
                          >
                            Abrir Carpeta
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Lista de archivos y carpetas */}
                    <Box sx={{ 
                      flex: 1,
                      overflowY: 'auto',
                      minHeight: 0
                    }}>
                      {/* Mensaje cuando no hay archivos */}
                      {files.length === 0 && folders.length === 0 && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            textAlign: 'center', 
                            py: 2,
                            color: contrast === 'high-contrast' ? '#ccc' : '#666',
                            fontStyle: 'italic'
                          }}
                        >
                          No hay archivos abiertos. Usa los botones de arriba para crear o abrir archivos.
                        </Typography>
                      )}

                      {/* Carpetas */}
                      {folders.map((folder) => (
                        <Box key={folder.id} sx={{ mb: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              p: 0.5,
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: contrast === 'high-contrast' ? '#333' : '#f0f0f0'
                              }
                            }}
                            onClick={() => toggleFolder(folder.id)}
                          >
                            {openFolders[folder.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            <Folder sx={{ mr: 1 }} />
                            <Typography variant="body2">{folder.name}</Typography>
                          </Box>
                          <Collapse in={openFolders[folder.id]}>
                            <Box sx={{ ml: 2 }}>
                              {folder.files.map((file) => (
                                <Box
                                  key={file.id}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    p: 0.5,
                                    borderRadius: 1,
                                    '&:hover': {
                                      backgroundColor: contrast === 'high-contrast' ? '#333' : '#f0f0f0'
                                    }
                                  }}
                                  onClick={() => handleFileClick(file)}
                                >
                                  <InsertDriveFile sx={{ mr: 1, fontSize: 16 }} />
                                  <Typography variant="caption">{file.name}</Typography>
                                </Box>
                              ))}
                            </Box>
                          </Collapse>
                        </Box>
                      ))}

                      {/* Archivos individuales */}
                      {files.map((file) => (
                        <Box
                          key={file.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            p: 0.5,
                            mb: 0.5,
                            borderRadius: 1,
                            '&:hover': {
                              backgroundColor: contrast === 'high-contrast' ? '#333' : '#f0f0f0'
                            }
                          }}
                          onClick={() => handleFileClick(file)}
                        >
                          <InsertDriveFile sx={{ mr: 1 }} />
                          <Typography variant="body2">{file.name}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Panel inferior: Estructura del código */}
                  {/* Panel inferior: Estructura del código */}
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden',
      borderTop: 1,
      borderColor: 'divider',
      height: '100%'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        p: 1,
        borderBottom: isCodeStructureOpen ? 1 : 0,
        borderColor: 'divider',
        cursor: 'pointer',
        backgroundColor: contrast === 'high-contrast' ? '#2d2d2d' : '#f5f5f5',
        flexShrink: 0
      }}
      onClick={() => setIsCodeStructureOpen(!isCodeStructureOpen)}
      >
        <Typography variant="body2" sx={{ flex: 1, fontWeight: 'medium' }}>
          Estructura del Código ({codeStructure.length} elementos)
        </Typography>
        <IconButton 
          size="small"
          aria-label="Alternar estructura del código"
          sx={{ color: contrast === 'high-contrast' ? '#fff' : 'inherit' }}
        >
          {isCodeStructureOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      {/* Always show the scrollable content, remove Collapse */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0,
        display: isCodeStructureOpen ? 'block' : 'none'
      }}>
        <List dense sx={{ p: 0 }}>
          {codeStructure.map((item, index) => (
            <ListItem
              key={index}
              sx={{
                borderBottom: '1px solid',
                borderColor: contrast === 'high-contrast' ? '#444' : '#ddd',
                py: 1,
                px: 1.5,
                '&:hover': {
                  backgroundColor: contrast === 'high-contrast' ? '#333' : '#f0f0f0'
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{
                      display: 'block',
                      wordBreak: 'break-word',
                      fontWeight: 'medium'
                    }}
                    aria-label={`${item.type} ${item.name ? `- ${item.name}` : ''} en línea ${item.line} y cierra en línea ${item.end_line}`}
                  >
                    <span style={{ 
                      color: contrast === 'high-contrast' ? '#4fc3f7' : '#1976d2',
                      fontWeight: 'bold'
                    }}>
                      {item.type}
                    </span>
                    {item.name && (
                      <span style={{ marginLeft: '8px' }}>
                        {item.name}
                      </span>
                    )}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="caption"
                    sx={{ 
                      color: contrast === 'high-contrast' ? '#aaa' : '#666',
                      fontSize: '0.75rem'
                    }}
                  >
                    Líneas {item.line}-{item.end_line}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
                </Split>
              ) : (
                // Vista sin estructura de código
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  minHeight: 0,
                  overflow: 'hidden',
                  p: 1,
                  flex: 1
                }}>
                  {/* Botones de acción en filas */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 1, 
                    mb: 2
                  }}>
                    {/* Primera fila */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Crear nuevo archivo">
                        <Button
                          onClick={handleCreateFile}
                          size="small"
                          startIcon={<NoteAddIcon />}
                          variant="outlined"
                          fullWidth
                          sx={{ 
                            color: contrast === 'high-contrast' ? '#fff' : 'inherit',
                            borderColor: contrast === 'high-contrast' ? '#fff' : 'inherit'
                          }}
                        >
                          Nuevo Archivo
                        </Button>
                      </Tooltip>
                      <Tooltip title="Crear nueva carpeta">
                        <Button
                          onClick={handleCreateFolder}
                          size="small"
                          startIcon={<CreateNewFolder />}
                          variant="outlined"
                          fullWidth
                          sx={{ 
                            color: contrast === 'high-contrast' ? '#fff' : 'inherit',
                            borderColor: contrast === 'high-contrast' ? '#fff' : 'inherit'
                          }}
                        >
                          Nueva Carpeta
                        </Button>
                      </Tooltip>
                    </Box>

                    {/* Segunda fila */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Abrir archivo desde el sistema">
                        <Button
                          onClick={handleOpenFile}
                          size="small"
                          startIcon={<FolderOpenIcon />}
                          variant="outlined"
                          fullWidth
                          sx={{ 
                            color: contrast === 'high-contrast' ? '#fff' : 'inherit',
                            borderColor: contrast === 'high-contrast' ? '#fff' : 'inherit'
                          }}
                        >
                          Abrir Archivo
                        </Button>
                      </Tooltip>
                      <Tooltip title="Abrir carpeta desde el sistema">
                        <Button
                          onClick={handleOpenFolder}
                          size="small"
                          startIcon={<FolderOpen />}
                          variant="outlined"
                          fullWidth
                          sx={{ 
                            color: contrast === 'high-contrast' ? '#fff' : 'inherit',
                            borderColor: contrast === 'high-contrast' ? '#fff' : 'inherit'
                          }}
                        >
                          Abrir Carpeta
                        </Button>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Lista de archivos y carpetas */}
                  <Box sx={{ 
                    flex: 1,
                    overflowY: 'auto',
                    minHeight: 0
                  }}>
                    {/* Mensaje cuando no hay archivos */}
                    {files.length === 0 && folders.length === 0 && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textAlign: 'center', 
                          py: 2,
                          color: contrast === 'high-contrast' ? '#ccc' : '#666',
                          fontStyle: 'italic'
                        }}
                      >
                        No hay archivos abiertos. Usa los botones de arriba para crear o abrir archivos.
                      </Typography>
                    )}

                    {/* Carpetas */}
                    {folders.map((folder) => (
                      <Box key={folder.id} sx={{ mb: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            p: 0.5,
                            borderRadius: 1,
                            '&:hover': {
                              backgroundColor: contrast === 'high-contrast' ? '#333' : '#f0f0f0'
                            }
                          }}
                          onClick={() => toggleFolder(folder.id)}
                        >
                          {openFolders[folder.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          <Folder sx={{ mr: 1 }} />
                          <Typography variant="body2">{folder.name}</Typography>
                        </Box>
                        <Collapse in={openFolders[folder.id]}>
                          <Box sx={{ ml: 2 }}>
                            {folder.files.map((file) => (
                              <Box
                                key={file.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  p: 0.5,
                                  borderRadius: 1,
                                  '&:hover': {
                                    backgroundColor: contrast === 'high-contrast' ? '#333' : '#f0f0f0'
                                  }
                                }}
                                onClick={() => handleFileClick(file)}
                              >
                                <InsertDriveFile sx={{ mr: 1, fontSize: 16 }} />
                                <Typography variant="caption">{file.name}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Collapse>
                      </Box>
                    ))}

                    {/* Archivos individuales */}
                    {files.map((file) => (
                      <Box
                        key={file.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          p: 0.5,
                          mb: 0.5,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: contrast === 'high-contrast' ? '#333' : '#f0f0f0'
                          }
                        }}
                        onClick={() => handleFileClick(file)}
                      >
                        <InsertDriveFile sx={{ mr: 1 }} />
                        <Typography variant="body2">{file.name}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Vista colapsada */}
      {collapsed && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2,
          p: 1
        }}>
          <Tooltip title="Archivos">
            <IconButton 
              aria-label="Archivos" 
              color={contrast === 'high-contrast' ? 'inherit' : 'primary'}
              onClick={() => {
                onToggleCollapse();
                setTabIndex(0);
              }}
            >
              <Folder />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chat">
            <IconButton 
              aria-label="Chat" 
              color={contrast === 'high-contrast' ? 'inherit' : 'primary'}
              onClick={() => {
                onToggleCollapse();
                setTabIndex(1);
              }}
            >
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Dialog para crear archivos/carpetas */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: contrast === 'high-contrast' ? '#1e1e1e' : 'background.paper',
            color: contrast === 'high-contrast' ? '#fff' : 'text.primary'
          }
        }}
      >
        <DialogTitle>
          {isFile ? 'Crear Nuevo Archivo' : 'Crear Nueva Carpeta'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: contrast === 'high-contrast' ? '#ccc' : 'inherit' }}>
            Ingresa el nombre para {isFile ? 'el archivo' : 'la carpeta'}:
            {isFile && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Tip: Si no especificas extensión, se agregará .txt automáticamente
              </Typography>
            )}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleDialogConfirm();
              }
            }}
            InputProps={{
              style: { color: contrast === 'high-contrast' ? '#fff' : '#000' }
            }}
            InputLabelProps={{
              style: { color: contrast === 'high-contrast' ? '#ccc' : 'inherit' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDialogConfirm} variant="contained">
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FileManager;