// src/components/FileManager.js
import React from 'react';
import { Box, Tabs, Tab, Typography, TextField, IconButton, CircularProgress, Button, Collapse, Menu, MenuItem, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, List, ListItem, ListItemText } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import { InsertDriveFile } from '@mui/icons-material';
import { CreateNewFolder } from '@mui/icons-material';
import { Folder } from '@mui/icons-material';
import { FolderOpen } from '@mui/icons-material';
import generateCode from '../utils/chat';
import useSpeechRecognition from '../utils/speech';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ExpandLess } from '@mui/icons-material';
import { ExpandMore } from '@mui/icons-material';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/FileManager.css'

function FileManager({ contrast, codeStructure, onFileOpen }) {
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
  // const [generatedCode, setGeneratedCode] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const { isListening, transcript, setIsListening } = useSpeechRecognition();
  const [isCodeStructureOpen, setIsCodeStructureOpen] = React.useState(false);

  React.useEffect(() => {
    if (transcript) {
      setPrompt(prevPrompt => `${prevPrompt} ${transcript}`);
    }
  }, [transcript]);
  
  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  // const handleGenerateCode = () => {
  //   generateCode(prompt, setGeneratedCode, setLoading);
  // };
  React.useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1].content;
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(lastMessage);
        utterance.lang = 'es-ES';
        utterance.onerror = (e) => console.error('Speech synthesis error:', e);
        utterance.onstart = () => console.log('Speech synthesis started');
        utterance.onend = () => console.log('Speech synthesis ended');
        window.speechSynthesis.speak(utterance);
      } else {
        console.error('Speech synthesis not supported in this browser.');
      }
    }
  }, [chatHistory]);

  React.useEffect(() => {
    if (isCodeStructureOpen && window.speechSynthesis) {
      const text = codeStructure.map(item => 
        `${item.type} ${item.name ? `- ${item.name}` : ''} en línea ${item.line} y cierra en línea ${item.end_line}`
      ).join('. ');

      if (text.trim()) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.2;
        utterance.onerror = (e) => console.error('Speech synthesis error:', e);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [isCodeStructureOpen, codeStructure]);

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const response = await generateCode(prompt, setLoading, chatHistory);
      setChatHistory(prevHistory => [
        ...prevHistory,
        { role: 'user', content: prompt },
        { role: 'model', content: response },
      ]);
      setPrompt('');
    } catch (error) {
      console.error("Error al generar código:", error);
    } finally {
      setLoading(false);
    }
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
    setIsListening(prevState => !prevState);
  };

  React.useEffect(() => {
    localStorage.setItem('files', JSON.stringify(files));
  }, [files]);

  React.useEffect(() => {
    localStorage.setItem('folders', JSON.stringify(folders));
  }, [folders]);

  const handleCreateFile = () => {
    setIsFile(true);
    setDialogOpen(true);
  };

  const handleCreateFolder = () => {
    setIsFile(false);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setNewName('');
  };

  const handleDialogSubmit = () => {
    if (newName) {
      if (isFile) {
        setFiles([...files, newName]);
      } else {
        setFolders([...folders, newName]);
      }
    }
    handleDialogClose();
  };

  const handleContextMenu = (event, item) => {
    event.preventDefault();
    setSelectedItem(item);
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
        : null,
    );
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleRename = () => {
    const newName = prompt('Enter new name:', selectedItem);
    if (newName) {
      if (files.includes(selectedItem)) {
        setFiles(files.map(file => (file === selectedItem ? newName : file)));
      } else {
        setFolders(folders.map(folder => (folder === selectedItem ? newName : folder)));
      }
    }
    handleClose();
  };

  const handleDelete = () => {
    if (files.includes(selectedItem)) {
      setFiles(files.filter(file => file !== selectedItem));
    } else {
      setFolders(folders.filter(folder => folder !== selectedItem));
    }
    handleClose();
  };

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files).map(file => file.name);
    setFiles([...files, ...uploadedFiles]);
  };

  const handleFolderUpload = (event) => {
    const uploadedFolders = Array.from(event.target.files).reduce((acc, file) => {
      const pathParts = file.webkitRelativePath.split('/');
      const folderName = pathParts[0];
      const fileName = pathParts.slice(1).join('/');
      if (!acc[folderName]) {
        acc[folderName] = [];
      }
      acc[folderName].push(fileName);
      return acc;
    }, {});

    const newFolders = Object.keys(uploadedFolders).map(folderName => ({
      name: folderName,
      files: uploadedFolders[folderName],
    }));

    setFolders([...folders, ...newFolders]);
  };

  const handleToggleFolder = (folderName) => {
    setOpenFolders(prevOpenFolders => ({
      ...prevOpenFolders,
      [folderName]: !prevOpenFolders[folderName],
    }));
  };
  
  return (
     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' , flex: 0.3,
      backgroundColor: contrast === 'high-contrast' ? '#1e1e1e' : 'inherit',
      color: contrast === 'high-contrast' ? '#fff' : 'inherit',
     }}>
      <Tabs value={tabIndex} onChange={handleTabChange} aria-label="File Manager Tabs" 
        textColor={contrast === 'high-contrast' ? 'inherit' : 'primary'}
        indicatorColor={'primary'}>
        <Tab label="Archivos" />
        <Tab label="Chat" />
        {/* pestañas */}
      </Tabs>
      <Box >
        {tabIndex === 1 && (
          <div>
            <Box sx={{ flexGrow: 1, overflowX: 'auto', mb: 2, height: '100%', padding: 2 }}>
              <Typography variant="h6" component="h2" aria-live="polite">
                Bienvenido a tu copiloto, estoy aquí para ayudarte a hacer las cosas más rápido.
              </Typography>
              {loading ? (
                <CircularProgress color={contrast === 'high-contrast' ? 'inherit' : 'primary'}/>
              ) : (
                // <div>
                //   {chatHistory.map((message, index) => (
                //     <Typography key={index} style={{ color: contrast === 'high-contrast' ? '#fff' : '#000' }}>
                //       <strong>{message.role === 'user' ? 'Tú: ' : 'Copiloto: '}</strong>
                //       {message.content}
                //     </Typography>
                //   ))}
                // </div>
                <ChatHistory chatHistory={chatHistory} contrast={contrast} /> 
                // <pre style={{ color: contrast === 'high-contrast' ? '#fff' : '#000' }}>{generatedCode}</pre>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', padding: 2 }}>
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
          </div>
        )}
        {/* contenido para otras pestañas */}
        {tabIndex === 0 && (
          <Box className="file-manager" sx={{padding: 2}}>
          {files.length === 0 && folders.length === 0 ? (
            <>
            <Typography>Aún no hay ningún archivo abierto, puedes realizar las siguientes acciones:</Typography>
            <div className="button-container">
              <Button onClick={handleCreateFile} aria-label="Crear archivo">Crear archivo</Button>
              <Button onClick={handleCreateFolder} aria-label="Crear carpeta">Crear carpeta</Button>
              <Button aria-label="Abrir archivo">
                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                  Abrir archivo
                </label>
                <input
                  id="file-upload"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </Button>
              <Button aria-label="Abrir carpeta">
              <label htmlFor="folder-upload" style={{ cursor: 'pointer' }}>
                  Abrir carpeta
                </label>
                <input
                  id="folder-upload"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFolderUpload}
                />
              </Button>
            </div>
          </>
          ) : (
            <>
              <div className="icon-container">
                <IconButton onClick={handleCreateFile} aria-label="Crear archivo">
                  <InsertDriveFile />
                </IconButton>
                <IconButton onClick={handleCreateFolder} aria-label="Crear carpeta">
                  <CreateNewFolder />
                </IconButton>
                <IconButton aria-label="Abrir archivo">
                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                  <FolderOpen />
                </label>
                <input
                  id="file-upload"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                </IconButton>
                <IconButton aria-label="Abrir carpeta">
                <label htmlFor="folder-upload" style={{ cursor: 'pointer' }}>
                  <Folder />
                </label>
                <input
                  id="folder-upload"
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  style={{ display: 'none' }}
                  onChange={handleFolderUpload}
                />
                </IconButton>
              </div>
              <Box className="file-list">
                {folders.map(folder => (
                  <div key={folder.name}>
                    <ListItem onClick={() => handleToggleFolder(folder.name)}>
                      <ListItemText primary={folder.name} />
                      {openFolders[folder.name] ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={openFolders[folder.name]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {folder.files.map(file => (
                          <ListItem key={file} button onContextMenu={(e) => handleContextMenu(e, file)}>
                            <ListItemText primary={file} />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </div>
                ))}
                {files.map(file => (
                  <Typography
                    key={file}
                    onClick={() => onFileOpen(file)}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                    aria-label={`Archivo ${file}`}
                  >
                    {file}
                  </Typography>
                ))}
              </Box>
            </>
          )}
          <Menu
            open={contextMenu !== null}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={
              contextMenu !== null
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
            }
          >
            <MenuItem onClick={handleRename} aria-label="Renombrar">Renombrar</MenuItem>
            <MenuItem onClick={handleDelete} aria-label="Eliminar">Eliminar</MenuItem>
          </Menu>
          <Dialog open={dialogOpen} onClose={handleDialogClose}>
            <DialogTitle>{isFile ? 'Crear archivo' : 'Crear carpeta'}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {isFile ? 'Ingrese el nombre del archivo:' : 'Ingrese el nombre de la carpeta:'}
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label={isFile ? 'Nombre del archivo' : 'Nombre de la carpeta'}
                type="text"
                fullWidth
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose} color="primary">
                Cancelar
              </Button>
              <Button onClick={handleDialogSubmit} color="primary">
                Crear
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
        )}
        {/* <Box >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">Estructura del Código</Typography>
            <IconButton onClick={() => setIsCodeStructureOpen(!isCodeStructureOpen)} aria-label="Toggle code structure">
              {isCodeStructureOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={isCodeStructureOpen}>
            <ul>
              {codeStructure.map((item, index) => (
                <li key={index}>
                  {item.type} {item.name ? `- ${item.name}` : ''} en línea {item.line} y cierra en línea {item.end_line}
                </li>
              ))}
            </ul>
          </Collapse>
        </Box> */}
        <Box sx={{ position: 'relative', flexGrow: 1, padding: 2 }}>
        
          {/* <Typography variant="h6">Estructura del Código</Typography> */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography>Estructura del Código</Typography>
            <IconButton onClick={() => setIsCodeStructureOpen(!isCodeStructureOpen)} aria-label="Estructura del codigo">
              {isCodeStructureOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={isCodeStructureOpen}>
            <Box
              sx={{
                overflowY: 'auto', // Habilita el scroll vertical
                maxHeight: '20%',
                padding: '8px', // Opcional: agrega un poco de padding
              }}
            >
              <List>
                {codeStructure.map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: contrast === 'high-contrast' ? '#444' : '#ddd',
                      padding: '8px 0',
                    }}
                  >
                    <Typography
                      aria-label={`${item.type} ${item.name ? `- ${item.name}` : ''} en línea ${item.line} y cierra en línea ${item.end_line}`}
                      sx={{ fontSize: '14px' }}
                    >
                      {item.type} {item.name ? `- ${item.name}` : ''} en línea {item.line} y cierra en línea {item.end_line}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Collapse>
      
        </Box>
      </Box>
        
    </Box>
  );
}

export default FileManager;
