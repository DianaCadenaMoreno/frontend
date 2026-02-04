import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MicIcon from '@mui/icons-material/Mic';
import NavigationIcon from '@mui/icons-material/Navigation';
import BuildIcon from '@mui/icons-material/Build';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import CodeIcon from '@mui/icons-material/Code';
import FolderIcon from '@mui/icons-material/Folder';
import TerminalIcon from '@mui/icons-material/Terminal';
import { useScreenReader } from '../contexts/ScreenReaderContext';
import { useAppNavigation } from '../contexts/NavigationContext';
import { useInteractionMode } from '../contexts/InteractionModeContext';

const HelpScreen = React.forwardRef(({ contrast, onClose }, ref) => {
  const { speak, speakOnFocus, speakOnHover, cancelHoverSpeak, stop } = useScreenReader();
  const { registerComponent, unregisterComponent, setFocusedComponent } = useAppNavigation();
  const helpRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [focusedAccordion, setFocusedAccordion] = useState(0);
  const accordionRefs = useRef([]);
  const [isHelpFocused, setIsHelpFocused] = useState(false);
  const [navigationMode, setNavigationMode] = useState('accordions');
  const [focusedContentIndex, setFocusedContentIndex] = useState(0);
  const contentItemsRefs = useRef([]);
  const { isKeyboardMode, isMouseMode } = useInteractionMode();

  // Obtener colores del tema
  const getThemeColors = (contrast) => {
    switch(contrast) {
      case 'high-contrast':
        return {
          background: '#000000',
          surface: '#1a1a1a',
          surfaceHover: '#2a2a2a',
          hover: '#333333',
          text: '#ffffff',
          textSecondary: '#cccccc',
          border: '#444444',
          accent: '#ffeb3b',
          info: '#00aaff',
          warning: '#00ff00',
          divider: '#333333',
          tableHeader: '#2a2a2a',
          tableRow: '#1a1a1a',
          tableRowAlt: '#222222'
        };
      case 'blue-contrast':
        return {
          background: '#0d1117',
          surface: '#161b22',
          surfaceHover: '#1f2937',
          hover: '#2d3748',
          text: '#E0E0E0',
          textSecondary: '#B0B0B0',
          border: '#30363d',
          accent: '#4FC3F7',
          info: '#81C784',
          warning: '#FFB74D',
          divider: '#21262d',
          tableHeader: '#1f2937',
          tableRow: '#161b22',
          tableRowAlt: '#1a1f26'
        };
      case 'yellow-contrast':
        return {
          background: '#FFFDE7',
          surface: '#FFF9C4',
          surfaceHover: '#FFF59D',
          hover: '#FFF176',
          text: '#212121',
          textSecondary: '#616161',
          border: '#E0E0E0',
          accent: '#D32F2F',
          info: '#388E3C',
          warning: '#F57C00',
          divider: '#F0F0F0',
          tableHeader: '#FFF59D',
          tableRow: '#FFF9C4',
          tableRowAlt: '#FFFDE7'
        };
      default:
        return {
          background: '#ffffff',
          surface: '#f5f5f5',
          surfaceHover: '#eeeeee',
          hover: '#e0e0e0',
          text: '#000000',
          textSecondary: '#666666',
          border: '#ddd',
          accent: '#1976d2',
          info: '#0288d1',
          warning: '#f57c00',
          divider: '#e0e0e0',
          tableHeader: '#e3f2fd',
          tableRow: '#f5f5f5',
          tableRowAlt: '#ffffff'
        };
    }
  };

  const themeColors = getThemeColors(contrast);

  const helpMessage = `
    Pantalla de ayuda de Code Flow.
    Aquí encontrarás todos los comandos de voz y atajos de teclado disponibles.
    
    Usa Tab para navegar entre las secciones.
    Presiona Enter para expandir una sección y leer su contenido.
    Presiona Escape para cerrar esta pantalla o volver a las secciones.
    
    Las secciones disponibles son:
    1. Navegación General - Atajos para moverte entre componentes
    2. Gestor de Archivos - Comandos para manejar archivos y carpetas
    3. Editor de Código - Atajos para escribir y ejecutar código
    4. Terminal - Comandos de la terminal
    5. Accesibilidad - Opciones de accesibilidad
    6. Comandos de Voz de Navegación - Controla la app con tu voz
    7. Comandos de Voz del Editor - Comandos de voz para el editor
  `;

  // Datos de los acordeones
  const accordionData = [
    {
      id: 'navigation',
      title: 'Navegación General',
      subtitle: 'Moverse entre componentes',
      icon: NavigationIcon
    },
    {
      id: 'filemanager',
      title: 'Gestor de Archivos',
      subtitle: 'Manejar archivos y carpetas',
      icon: FolderIcon
    },
    {
      id: 'editor',
      title: 'Editor de Código',
      subtitle: 'Escribir y ejecutar código',
      icon: CodeIcon
    },
    {
      id: 'terminal',
      title: 'Terminal',
      subtitle: 'Comandos de consola',
      icon: TerminalIcon
    },
    {
      id: 'accessibility',
      title: 'Accesibilidad',
      subtitle: 'Opciones de accesibilidad',
      icon: AccessibilityNewIcon
    },
    {
      id: 'voice-navigation',
      title: 'Comandos de Voz - Navegación',
      subtitle: 'Controlar la app con voz',
      icon: MicIcon
    },
    {
      id: 'voice-editor',
      title: 'Comandos de Voz - Editor',
      subtitle: 'Comandos de voz para el editor',
      icon: MicIcon
    }
  ];

  // Datos de comandos
  const commandsData = {
    navigation: [
      { shortcut: 'Alt + 1', description: 'Ir a la barra de navegación' },
      { shortcut: 'Alt + 2', description: 'Ir al gestor de archivos' },
      { shortcut: 'Alt + 3', description: 'Ir al editor de código' },
      { shortcut: 'Alt + 4', description: 'Ir a la terminal' },
      { shortcut: 'Alt + B', description: 'Volver a la pantalla de bienvenida' },
      { shortcut: 'Alt + H', description: 'Mostrar esta ayuda' },
      { shortcut: 'F1', description: 'Mostrar ayuda' },
      { shortcut: 'Tab', description: 'Navegar al siguiente elemento' },
      { shortcut: 'Shift + Tab', description: 'Navegar al elemento anterior' },
      { shortcut: 'Enter', description: 'Activar o expandir elemento' },
      { shortcut: 'Escape', description: 'Cerrar diálogo o cancelar acción' },
      { shortcut: 'Flechas', description: 'Navegar dentro de listas y menús' }
    ],
    filemanager: [
      { shortcut: 'Ctrl + Alt + N', description: 'Crear nuevo archivo' },
      { shortcut: 'Ctrl + Alt + F', description: 'Crear nueva carpeta' },
      { shortcut: 'Ctrl + Alt + O', description: 'Abrir archivo del sistema' },
      { shortcut: 'Flecha Arriba/Abajo', description: 'Navegar entre archivos' },
      { shortcut: 'Enter', description: 'Abrir archivo o expandir carpeta' },
      { shortcut: 'M', description: 'Abrir menú contextual' },
      { shortcut: 'Delete', description: 'Eliminar archivo o carpeta seleccionada' },
      { shortcut: 'F2', description: 'Renombrar archivo o carpeta' },
      { shortcut: 'Tab', description: 'Cambiar entre pestañas (Archivos, Chat, Estructura)' }
    ],
    editor: [
      { shortcut: 'F5', description: 'Ejecutar código' },
      { shortcut: 'F6', description: 'Activar transcripción de voz' },
      { shortcut: 'F7', description: 'Detener ejecución' },
      { shortcut: 'F8', description: 'Cancelar ejecución (abortar)' },
      { shortcut: 'Alt + S', description: 'Guardar archivo' },
      { shortcut: 'Alt + E', description: 'Ejecutar código' },
      { shortcut: 'Alt + T', description: 'Activar transcripción' },
      { shortcut: 'Ctrl + Z', description: 'Deshacer' },
      { shortcut: 'Ctrl + Y', description: 'Rehacer' },
      { shortcut: 'Ctrl + C', description: 'Copiar' },
      { shortcut: 'Ctrl + V', description: 'Pegar' },
      { shortcut: 'Ctrl + X', description: 'Cortar' },
      { shortcut: 'Ctrl + A', description: 'Seleccionar todo' },
      { shortcut: 'Ctrl + F', description: 'Buscar en el código' }
    ],
    terminal: [
      { shortcut: 'Alt + 4', description: 'Enfocar terminal' },
      { shortcut: 'Ctrl + C', description: 'Cancelar comando en ejecución' },
      { shortcut: 'Ctrl + L', description: 'Limpiar terminal' },
      { shortcut: 'Flecha Arriba', description: 'Comando anterior del historial' },
      { shortcut: 'Flecha Abajo', description: 'Siguiente comando del historial' },
      { shortcut: 'Tab', description: 'Autocompletar comando' }
    ],
    accessibility: [
      { shortcut: 'F2', description: 'Activar/desactivar lector de pantalla' },
      { shortcut: 'F3', description: 'Cambiar tema de contraste' },
      { shortcut: 'Alt + L', description: 'Activar/desactivar lector de pantalla' },
      { shortcut: 'Alt + C', description: 'Cambiar tema de contraste' },
      { shortcut: 'Alt + +', description: 'Aumentar zoom' },
      { shortcut: 'Alt + -', description: 'Reducir zoom' }
    ],
    'voice-navigation': [
      { command: '"navegación" o "barra de navegación"', action: 'Ir a la barra de navegación' },
      { command: '"archivos" o "gestor de archivos"', action: 'Ir al gestor de archivos' },
      { command: '"editor" o "código"', action: 'Ir al editor de código' },
      { command: '"terminal" o "consola"', action: 'Ir a la terminal' },
      { command: '"guía" o "bienvenida"', action: 'Ir a la pantalla de bienvenida' },
      { command: '"ayuda"', action: 'Mostrar esta pantalla de ayuda' },
      { command: '"menú archivos"', action: 'Abrir menú de archivos' },
      { command: '"menú ajustes"', action: 'Abrir menú de ajustes' },
      { command: '"menú ayuda"', action: 'Abrir menú de ayuda' },
      { command: '"chat" o "copiloto"', action: 'Ir al chat con el asistente' },
      { command: '"estructura"', action: 'Ver estructura del código' }
    ],
    'voice-editor': [
      { command: '"ejecutar" o "correr código"', action: 'Ejecutar el código actual' },
      { command: '"transcribir" o "dictar"', action: 'Activar transcripción de voz a código' },
      { command: '"detener" o "parar"', action: 'Detener la ejecución del código' },
      { command: '"cancelar" o "abortar"', action: 'Cancelar la ejecución completamente' },
      { command: '"guardar"', action: 'Guardar el archivo actual' },
      { command: '"crear archivo" o "nuevo archivo"', action: 'Crear un nuevo archivo' },
      { command: '"crear carpeta" o "nueva carpeta"', action: 'Crear una nueva carpeta' },
      { command: '"alto contraste" o "contraste"', action: 'Cambiar tema de contraste' },
      { command: '"lector de pantalla" o "lector"', action: 'Activar/desactivar lector' },
      { command: '"ampliar" o "aumentar"', action: 'Aumentar zoom' },
      { command: '"reducir" o "disminuir"', action: 'Reducir zoom' }
    ]
  };

  // Obtener contenido del acordeón actual
  const getContentItems = (accordionId) => {
    const commands = commandsData[accordionId] || [];
    return commands.map(cmd => {
      if (cmd.shortcut) {
        return `${cmd.shortcut}: ${cmd.description}`;
      } else {
        return `${cmd.command}: ${cmd.action}`;
      }
    });
  };

  const handleKeyDown = (e) => {
    if (!isHelpFocused) return;

    // Escape para salir
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      
      if (navigationMode === 'content') {
        setNavigationMode('accordions');
        setExpanded(false);
        setFocusedContentIndex(0);
        speak('Sección cerrada. De vuelta a navegación de secciones. Usa Tab para navegar entre secciones.');
      } else {
        stop();
        setIsHelpFocused(false);
        if (onClose) {
          onClose();
        }
        speak('Cerrando pantalla de ayuda');
      }
      return;
    }

    // Navegación en modo acordeones
    if (navigationMode === 'accordions') {
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          e.stopPropagation();
          const direction = e.shiftKey ? -1 : 1;
          const newIndex = (focusedAccordion + direction + accordionData.length) % accordionData.length;
          setFocusedAccordion(newIndex);
          
          const accordion = accordionData[newIndex];
          const isExpanded = expanded === accordion.id;
          speakOnFocus(
            `Sección ${newIndex + 1} de ${accordionData.length}: ${accordion.title}. ${accordion.subtitle}. 
            ${isExpanded ? 'Sección expandida' : 'Presiona Enter para expandir y leer los comandos'}. 
            Presiona Escape para cerrar la pantalla de ayuda.`
          );
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          e.stopPropagation();
          const currentAccordion = accordionData[focusedAccordion];
          const isCurrentlyExpanded = expanded === currentAccordion.id;
          
          if (!isCurrentlyExpanded) {
            setExpanded(currentAccordion.id);
            setNavigationMode('content');
            setFocusedContentIndex(0);
            
            const contentItems = getContentItems(currentAccordion.id);
            const firstItem = contentItems[0] || '';
            speak(
              `Sección expandida: ${currentAccordion.title}. ${contentItems.length} comandos. 
              Usa Tab para navegar entre comandos. Presiona Escape para volver a las secciones. 
              Primer comando: ${firstItem}`
            );
          } else {
            setExpanded(false);
            speak(`Sección colapsada: ${currentAccordion.title}. Presiona Enter para expandir nuevamente.`);
          }
          break;

        default:
          break;
      }
    }
    // Navegación dentro del contenido
    else if (navigationMode === 'content') {
      const currentAccordion = accordionData[focusedAccordion];
      const contentItems = getContentItems(currentAccordion.id);

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          e.stopPropagation();
          const direction = e.shiftKey ? -1 : 1;
          const newIndex = (focusedContentIndex + direction + contentItems.length) % contentItems.length;
          setFocusedContentIndex(newIndex);
          
          speakOnFocus(
            `Comando ${newIndex + 1} de ${contentItems.length}: ${contentItems[newIndex]}. 
            Usa Tab para continuar navegando. Presiona Escape para volver a las secciones.`
          );
          break;

        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          speak(contentItems[focusedContentIndex]);
          break;

        default:
          break;
      }
    }
  };

  // Registrar componente
  useEffect(() => {
    const helpAPI = {
      focus: () => {
        if (helpRef.current) {
          setIsHelpFocused(true);
          setNavigationMode('accordions');
          setExpanded(false);
          setFocusedAccordion(0);
          setFocusedContentIndex(0);
          helpRef.current.focus();
          setFocusedComponent('help');
          
          setTimeout(() => {
            speak(helpMessage, { rate: 1.1 });
          }, 100);
        }
      },
      blur: () => {
        setIsHelpFocused(false);
        setNavigationMode('accordions');
        setExpanded(false);
        setFocusedContentIndex(0);
        stop();
      }
    };

    registerComponent('help', helpAPI);

    return () => {
      unregisterComponent('help');
      setIsHelpFocused(false);
      stop();
    };
  }, [registerComponent, unregisterComponent, speak, setFocusedComponent, stop, helpMessage]);

  React.useImperativeHandle(ref, () => ({
    focus: () => {
      if (helpRef.current) {
        setIsHelpFocused(true);
        setNavigationMode('accordions');
        setExpanded(false);
        setFocusedAccordion(0);
        setFocusedContentIndex(0);
        helpRef.current.focus();
        setFocusedComponent('help');
        setTimeout(() => {
          speak(helpMessage, { rate: 1.1 });
        }, 100);
      }
    },
    blur: () => {
      setIsHelpFocused(false);
      setNavigationMode('accordions');
      setExpanded(false);
      setFocusedContentIndex(0);
      stop();
    }
  }), [setFocusedComponent, speak, stop, helpMessage]);

  const AccordionSection = ({ id, index, icon: Icon, title, subtitle, children }) => {
    const isFocused = focusedAccordion === index && isHelpFocused && navigationMode === 'accordions';
    const isExpanded = expanded === id;

    const handleAccordionClick = (event) => {
      if (event.detail === 0) return;
      
      if (isMouseMode) {
        const newExpanded = isExpanded ? false : id;
        setExpanded(newExpanded);
        
        if (newExpanded) {
          setNavigationMode('content');
          setFocusedAccordion(index);
          setFocusedContentIndex(0);
          
          const contentItems = getContentItems(id);
          speak(`Sección expandida: ${title}. ${contentItems.length} comandos.`);
        } else {
          setNavigationMode('accordions');
          setFocusedContentIndex(0);
          speak(`Sección colapsada: ${title}.`);
        }
      }
    };
    
    return (
      <Accordion
        expanded={isExpanded}
        onChange={handleAccordionClick}
        ref={(el) => (accordionRefs.current[index] = el)}
        tabIndex={-1}
        sx={{
          backgroundColor: themeColors.surface,
          color: themeColors.text,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '8px !important',
          mb: 2,
          '&:before': { display: 'none' },
          outline: isFocused ? `3px solid ${themeColors.accent}` : 'none',
          outlineOffset: '2px',
          transition: 'all 0.2s ease',
          pointerEvents: isKeyboardMode ? 'none' : 'auto',
          '&:hover': {
            backgroundColor: themeColors.surfaceHover,
            borderColor: themeColors.accent
          }
        }}
        onMouseEnter={() => {
          if (isMouseMode) {
            speakOnHover(`${title}. ${subtitle}`);
          }
        }}
        onMouseLeave={() => {
          if (isMouseMode) {
            cancelHoverSpeak();
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: themeColors.accent }} />}
          sx={{
            backgroundColor: isFocused ? themeColors.hover : themeColors.surface,
            '&:hover': {
              backgroundColor: isKeyboardMode ? (isFocused ? themeColors.hover : themeColors.surface) : themeColors.surfaceHover
            },
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 2
            }
          }}
        >
          <Icon sx={{ color: themeColors.accent, fontSize: 32 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: themeColors.text, 
                fontWeight: 'bold',
                wordBreak: 'break-word'
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: themeColors.textSecondary,
                  wordBreak: 'break-word'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ backgroundColor: themeColors.background, pt: 2 }}>
          {children}
        </AccordionDetails>
      </Accordion>
    );
  };

  // Renderizar contenido de cada acordeón
  const renderAccordionContent = (accordionId) => {
    const commands = commandsData[accordionId] || [];
    const isVoiceSection = accordionId.startsWith('voice-');
    
    return (
      <TableContainer 
        component={Paper} 
        sx={{ 
          backgroundColor: themeColors.surface,
          border: `1px solid ${themeColors.border}`,
          borderRadius: 2
        }}
      >
        <Table size="small" aria-label={`Tabla de comandos de ${accordionData.find(a => a.id === accordionId)?.title}`}>
          <TableHead>
            <TableRow sx={{ backgroundColor: themeColors.tableHeader }}>
              <TableCell 
                sx={{ 
                  color: themeColors.text, 
                  fontWeight: 'bold',
                  borderBottom: `1px solid ${themeColors.border}`,
                  width: isVoiceSection ? '45%' : '35%'
                }}
              >
                {isVoiceSection ? 'Comando de Voz' : 'Atajo de Teclado'}
              </TableCell>
              <TableCell 
                sx={{ 
                  color: themeColors.text, 
                  fontWeight: 'bold',
                  borderBottom: `1px solid ${themeColors.border}`
                }}
              >
                {isVoiceSection ? 'Acción' : 'Descripción'}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {commands.map((cmd, index) => {
              const isFocused = navigationMode === 'content' && focusedContentIndex === index;
              const key = isVoiceSection ? cmd.command : cmd.shortcut;
              const value = isVoiceSection ? cmd.action : cmd.description;
              
              return (
                <TableRow 
                  key={index}
                  ref={(el) => {
                    if (navigationMode === 'content') {
                      contentItemsRefs.current[index] = el;
                    }
                  }}
                  sx={{ 
                    backgroundColor: isFocused 
                      ? themeColors.hover 
                      : index % 2 === 0 
                        ? themeColors.tableRow 
                        : themeColors.tableRowAlt,
                    outline: isFocused ? `2px solid ${themeColors.accent}` : 'none',
                    outlineOffset: '-2px',
                    '&:hover': { 
                      backgroundColor: isKeyboardMode 
                        ? (isFocused ? themeColors.hover : (index % 2 === 0 ? themeColors.tableRow : themeColors.tableRowAlt))
                        : themeColors.surfaceHover
                    }
                  }}
                  onMouseEnter={() => {
                    if (isMouseMode) {
                      speakOnHover(`${key}: ${value}`);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isMouseMode) {
                      cancelHoverSpeak();
                    }
                  }}
                >
                  <TableCell 
                    sx={{ 
                      borderBottom: `1px solid ${themeColors.border}`,
                      py: 1.5
                    }}
                  >
                    <Chip 
                      label={key}
                      size="small"
                      sx={{ 
                        backgroundColor: themeColors.accent,
                        color: contrast === 'high-contrast' || contrast === 'yellow-contrast' ? '#000' : '#fff',
                        fontWeight: 'bold',
                        fontFamily: isVoiceSection ? 'inherit' : 'monospace',
                        fontSize: isVoiceSection ? '0.8rem' : '0.85rem'
                      }}
                    />
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: themeColors.text,
                      borderBottom: `1px solid ${themeColors.border}`,
                      py: 1.5
                    }}
                  >
                    {value}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box
      ref={helpRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        setIsHelpFocused(true);
        setFocusedComponent('help');
        if (navigationMode === 'accordions') {
          speakOnFocus('Pantalla de ayuda. Usa Tab para navegar entre secciones. Presiona Enter para expandir una sección. Presiona Escape para cerrar.');
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsHelpFocused(false);
          setNavigationMode('accordions');
          setExpanded(false);
        }
      }}
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: themeColors.background,
        color: themeColors.text,
        overflowY: 'auto',
        overflowX: 'hidden',
        outline: isHelpFocused ? `3px solid ${themeColors.accent}` : 'none',
        outlineOffset: '-3px',
        p: { xs: 1, sm: 2, md: 3 },
        boxSizing: 'border-box',
        '&::-webkit-scrollbar': {
          width: '12px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: themeColors.background,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: themeColors.accent,
          borderRadius: '6px',
          border: `2px solid ${themeColors.background}`,
          '&:hover': {
            backgroundColor: themeColors.info,
          }
        },
        scrollbarWidth: 'thin',
        scrollbarColor: `${themeColors.accent} ${themeColors.background}`,
      }}
      role="main"
      aria-label="Pantalla de ayuda de Code Flow"
    >
      <Paper
        elevation={3}
        sx={{
          backgroundColor: themeColors.surface,
          color: themeColors.text,
          border: `2px solid ${themeColors.border}`,
          borderRadius: 3,
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: '1000px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
            <KeyboardIcon sx={{ fontSize: 48, color: themeColors.accent }} />
            <MicIcon sx={{ fontSize: 48, color: themeColors.info }} />
          </Box>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              color: themeColors.accent,
              fontWeight: 'bold',
              mb: 1,
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
              wordBreak: 'break-word'
            }}
          >
            Comandos y Atajos
          </Typography>
          <Typography
            variant="h6"
            sx={{ 
              color: themeColors.textSecondary, 
              mb: 3,
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
              wordBreak: 'break-word',
              px: { xs: 1, sm: 2 }
            }}
          >
            Todos los atajos de teclado y comandos de voz disponibles en Code Flow
          </Typography>
          <Divider sx={{ borderColor: themeColors.divider, my: 2 }} />
          <Typography 
            variant="body2" 
            sx={{ 
              color: themeColors.info, 
              fontStyle: 'italic',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              wordBreak: 'break-word',
              px: { xs: 1, sm: 2 }
            }}
          >
            Usa Tab para navegar entre secciones y Enter para expandir. Escape para cerrar.
          </Typography>
        </Box>

        {/* Acordeones */}
        {accordionData.map((accordion, index) => (
          <AccordionSection
            key={accordion.id}
            id={accordion.id}
            index={index}
            icon={accordion.icon}
            title={accordion.title}
            subtitle={accordion.subtitle}
          >
            {renderAccordionContent(accordion.id)}
          </AccordionSection>
        ))}

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Divider sx={{ borderColor: themeColors.divider, my: 3 }} />
          <Box sx={{ 
            p: 2, 
            backgroundColor: themeColors.background, 
            borderRadius: 1, 
            border: `1px solid ${themeColors.border}` 
          }}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: themeColors.text, 
                mb: 1,
                wordBreak: 'break-word'
              }}
            >
              <strong>Consejo:</strong> Los comandos de voz funcionan mejor cuando hablas claramente y en español.
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: themeColors.warning, 
                fontWeight: 'bold',
                wordBreak: 'break-word'
              }}
            >
              Presiona <Chip label="Escape" size="small" sx={{ backgroundColor: themeColors.accent, color: contrast === 'high-contrast' || contrast === 'yellow-contrast' ? '#000' : '#fff', fontWeight: 'bold', mx: 0.5 }} /> 
              para cerrar esta ayuda o <Chip label="Alt + B" size="small" sx={{ backgroundColor: themeColors.accent, color: contrast === 'high-contrast' || contrast === 'yellow-contrast' ? '#000' : '#fff', fontWeight: 'bold', mx: 0.5 }} /> 
              para ir a la bienvenida
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
});

export default HelpScreen;