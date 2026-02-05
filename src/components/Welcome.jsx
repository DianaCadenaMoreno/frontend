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
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MicIcon from '@mui/icons-material/Mic';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useScreenReader } from '../contexts/ScreenReaderContext';
import { useAppNavigation } from '../contexts/NavigationContext';
import { useInteractionMode } from '../contexts/InteractionModeContext';

const WelcomeScreen = React.forwardRef(({ contrast }, ref) => {
  const { speak, speakOnFocus, speakOnHover, cancelHoverSpeak, stop } = useScreenReader();
  const { registerComponent, unregisterComponent, setFocusedComponent } = useAppNavigation();
  const welcomeRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [focusedAccordion, setFocusedAccordion] = useState(0);
  const accordionRefs = useRef([]);
  const [isWelcomeFocused, setIsWelcomeFocused] = useState(false);
  const [navigationMode, setNavigationMode] = useState('accordions'); // 'accordions' o 'content'
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
          divider: '#333333'
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
          divider: '#21262d'
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
          divider: '#F0F0F0'
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
          divider: '#e0e0e0'
        };
    }
  };

  const themeColors = getThemeColors(contrast);

  const welcomeMessage = `
    Bienvenido a Code Flow, tu entorno de desarrollo integrado accesible para Python.
    
    Estás en la pantalla de bienvenida. 
    Usa Tab para navegar entre las secciones disponibles.
    Presiona Enter para expandir una sección y leer su contenido.
    Presiona Escape para salir de esta pantalla.
    Presiona Alt más B en cualquier momento para volver aquí.
    
    Las secciones disponibles son:
    1. Introducción a Code Flow
    2. Características de Accesibilidad
    3. Atajos de Teclado
    4. Comandos de Voz
    5. Primeros Pasos
    6. Gestor de Archivos
    7. Editor de Código
    8. Chat con Copiloto
    
    Presiona Alt más 2 para ir al gestor de archivos y crear tu primer archivo.
  `;

  const accordionData = [
    {
      id: 'intro',
      title: 'Introducción',
      subtitle: '¿Qué es Code Flow?',
      icon: AccessibilityNewIcon
    },
    {
      id: 'accessibility',
      title: 'Características de Accesibilidad',
      subtitle: 'Diseñado para todos',
      icon: AccessibilityNewIcon
    },
    {
      id: 'keyboard',
      title: 'Atajos de Teclado',
      subtitle: 'Navegación rápida',
      icon: KeyboardIcon
    },
    {
      id: 'voice',
      title: 'Comandos de Voz',
      subtitle: 'Control por voz',
      icon: MicIcon
    },
    {
      id: 'steps',
      title: 'Primeros Pasos',
      subtitle: 'Comienza a programar',
      icon: PlayArrowIcon
    },
    {
      id: 'filemanager',
      title: 'Gestor de Archivos',
      subtitle: 'Organiza tu proyecto',
      icon: KeyboardIcon
    },
    {
      id: 'editor',
      title: 'Editor de Código',
      subtitle: 'Escribe y ejecuta Python',
      icon: KeyboardIcon
    },
    {
      id: 'chat',
      title: 'Chat con Copiloto',
      subtitle: 'Tu asistente de IA',
      icon: MicIcon
    }
  ];

  // Obtener contenido del acordeón actual
  const getContentItems = (accordionId) => {
    const contentMap = {
      intro: [
        'Code Flow es un entorno de desarrollo integrado diseñado específicamente para ser usable para usuarios con baja visión o invidentes.',
        'Consejo: Esta guía está siempre disponible. Presiona Alt más B o di guía para volver aquí.'
      ],
      accessibility: [
        'Navegación por teclado con atajos personalizados',
        'Comandos de voz para control manos libres',
        'Lector de pantalla integrado con síntesis de voz',
        'Temas de alto contraste',
        'Zoom y lupa para ampliar contenido',
        'Transcripción de voz a código Python'
      ],
      keyboard: [
        'Alt más 1: Ir a la barra de navegación',
        'Alt más 2: Ir al gestor de archivos',
        'Alt más 3: Ir al editor de código',
        'Alt más 4: Ir a la terminal',
        'Alt más A: Mostrar ayuda',
        'Alt más B: Volver a esta guía',
        'Alt más L: Activar o desactivar lector de pantalla',
        'Alt más C: Cambiar tema de contraste',
        'F5: Ejecutar código'
      ],
      voice: [
        'Di archivos para abrir gestor de archivos',
        'Di crear archivo para crear nuevo archivo',
        'Di crear carpeta para crear nueva carpeta',
        'Di editor para ir al editor de código',
        'Di terminal para ir a la terminal',
        'Di chat para abrir asistente de IA',
        'Di alto contraste para cambiar contraste',
        'Di lector para activar o desactivar lector de pantalla'
      ],
      steps: [
        'Paso 1: Abrir Gestor de Archivos. Presiona Alt más 2 o di archivos',
        'Paso 2: Crear un Archivo. Usa el botón Nuevo Archivo o di crear archivo',
        'Paso 3: Escribir Código. Escribe tu código Python en el editor',
        'Paso 4: Ejecutar. Presiona Ejecutar o Control más Enter para ver resultados'
      ],
      filemanager: [
        'Flechas arriba y abajo: Navegar entre archivos y carpetas',
        'Enter: Abrir archivo o expandir carpeta',
        'M: Abrir menú contextual, renombrar, eliminar, descargar',
        'Tab: Cambiar entre secciones del gestor',
        'Espacio: Seleccionar o deseleccionar elemento'
      ],
      editor: [
        'Resaltado de sintaxis automático',
        'Transcripción de voz a código',
        'F5: Ejecutar código',
        'Control más S: Guardar archivo dentro de mi equipo',
        'Alt más S: Guardar archivo dentro de codeflow',
        'Control más Z: Deshacer',
        'Control más Y: Rehacer',
        'El editor lee el código mientras escribes'
      ],
      chat: [
        'El copiloto puede generar código automáticamente',
        'Explicar conceptos de programación',
        'Depurar y corregir errores',
        'Sugerir mejoras en tu código',
        'Responder preguntas sobre Python',
        'Accede al chat desde el gestor de archivos, segunda pestaña, o di chat'
      ]
    };
    return contentMap[accordionId] || [];
  };

  const handleKeyDown = (e) => {
    if (!isWelcomeFocused) return;

    // Siempre permitir Escape para salir
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      
      if (navigationMode === 'content') {
        // Volver a navegación de acordeones
        setNavigationMode('accordions');
        setExpanded(false);
        setFocusedContentIndex(0);
        speak('Sección cerrada. De vuelta a navegación de secciones. Usa Tab para navegar entre secciones.');
      } else {
        // Salir del componente Welcome
        stop();
        setIsWelcomeFocused(false);
        speak('Saliendo de la pantalla de bienvenida');
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
            ${isExpanded ? 'Sección expandida' : 'Presiona Enter para expandir y leer el contenido'}. 
            Presiona Escape para salir de la pantalla de bienvenida.`
          );
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          e.stopPropagation();
          const currentAccordion = accordionData[focusedAccordion];
          const isCurrentlyExpanded = expanded === currentAccordion.id;
          
          if (!isCurrentlyExpanded) {
            // Expandir y leer contenido
            setExpanded(currentAccordion.id);
            setNavigationMode('content');
            setFocusedContentIndex(0);
            
            const contentItems = getContentItems(currentAccordion.id);
            const firstItem = contentItems[0] || '';
            speak(
              `Sección expandida: ${currentAccordion.title}. ${contentItems.length} elementos. 
              Usa Tab para navegar entre elementos. Presiona Escape para volver a las secciones. 
              Primer elemento: ${firstItem}`
            );
          } else {
            // Colapsar
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
            `Elemento ${newIndex + 1} de ${contentItems.length}: ${contentItems[newIndex]}. 
            Usa Tab para continuar navegando. Presiona Escape para volver a las secciones.`
          );
          break;

        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          // Leer el elemento actual completo
          speak(contentItems[focusedContentIndex]);
          break;

        default:
          break;
      }
    }
  };

    // Registrar componente en el sistema de navegación
    useEffect(() => {
        const welcomeAPI = {
            focus: () => {
            if (welcomeRef.current) {
                setIsWelcomeFocused(true);
                setNavigationMode('accordions');
                setExpanded(false);
                setFocusedAccordion(0);
                setFocusedContentIndex(0);
                welcomeRef.current.focus();
                setFocusedComponent('welcome');
                
                // SOLO hablar si NO es auto-focus inicial
                // Detectar si es interacción del usuario (Alt+B, comando de voz, etc.)
                if (document.hasFocus() && document.activeElement !== document.body) {
                setTimeout(() => {
                    speak(welcomeMessage, { rate: 1.1 });
                }, 100);
                }
            }
            },
            blur: () => {
            setIsWelcomeFocused(false);
            setNavigationMode('accordions');
            setExpanded(false);
            setFocusedContentIndex(0);
            stop();
        }
    };

    registerComponent('welcome', welcomeAPI);

    // CRÍTICO: No hablar en auto-focus inicial
    const checkAndFocus = () => {
        const files = JSON.parse(localStorage.getItem('files')) || [];
        const folders = JSON.parse(localStorage.getItem('folders')) || [];
        const hasContent = files.length > 0 || folders.length > 0;
        
        if (!hasContent && welcomeRef.current) {
        setTimeout(() => {
            setIsWelcomeFocused(true);
            setNavigationMode('accordions');
            welcomeRef.current.focus();
            setFocusedComponent('welcome');
            
            // NO intentar hablar aquí - Chrome lo bloqueará
            // El usuario debe presionar una tecla primero
        }, 500);
        }
    };

    checkAndFocus();

    return () => {
        unregisterComponent('welcome');
        setIsWelcomeFocused(false);
        stop();
    };
    }, [registerComponent, unregisterComponent, speak, setFocusedComponent, stop]);

    React.useImperativeHandle(ref, () => ({
        focus: () => {
            if (welcomeRef.current) {
            setIsWelcomeFocused(true);
            setNavigationMode('accordions');
            setExpanded(false);
            setFocusedAccordion(0);
            setFocusedContentIndex(0);
            welcomeRef.current.focus();
            setFocusedComponent('welcome');
            // Usar setTimeout para asegurar que el lector esté listo
            setTimeout(() => {
                speak(welcomeMessage, { rate: 1.1 });
            }, 100);
            }
        },
        blur: () => {
            setIsWelcomeFocused(false);
            setNavigationMode('accordions');
            setExpanded(false);
            setFocusedContentIndex(0);
            stop();
        }
    }), [setFocusedComponent, speak, stop]);

  const AccordionSection = ({ id, index, icon: Icon, title, subtitle, children }) => {
    const isFocused = focusedAccordion === index && isWelcomeFocused && navigationMode === 'accordions';
    const isExpanded = expanded === id;

    const handleAccordionClick = (event) => {
      // Solo responder si es click de mouse
      if (event.detail === 0) return; // Ignorar eventos sintéticos sin click
      
      if (isMouseMode) {
        const newExpanded = isExpanded ? false : id;
        setExpanded(newExpanded);
        
        if (newExpanded) {
          // Expandir
          setNavigationMode('content');
          setFocusedAccordion(index);
          setFocusedContentIndex(0);
          
          const contentItems = getContentItems(id);
          speak(`Sección expandida: ${title}. ${contentItems.length} elementos.`);
        } else {
          // Colapsar
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
    const items = getContentItems(accordionId);
    
    return (
      <List dense>
        {items.map((item, index) => {
          const isFocused = navigationMode === 'content' && focusedContentIndex === index;
          
          return (
            <ListItem 
              key={index}
              ref={(el) => {
                if (navigationMode === 'content') {
                  contentItemsRefs.current[index] = el;
                }
              }}
              sx={{ 
                py: 1.5,
                backgroundColor: isFocused ? themeColors.hover : 'transparent',
                outline: isFocused ? `2px solid ${themeColors.accent}` : 'none',
                outlineOffset: '2px',
                borderRadius: 1,
                '&:hover': { 
                  backgroundColor: isKeyboardMode ? (isFocused ? themeColors.hover : 'transparent') : themeColors.surfaceHover
                }
              }}
              onMouseEnter={() => {
                if (isMouseMode) {
                  speakOnHover(item);
                }
              }}
              onMouseLeave={() => {
                if (isMouseMode) {
                  cancelHoverSpeak();
                }
              }}
            >
              <ListItemText
                primary={`• ${item}`}
                sx={{ 
                  '& .MuiListItemText-primary': { 
                    color: themeColors.text,
                    wordBreak: 'break-word'
                  } 
                }}
              />
            </ListItem>
          );
        })}
      </List>
    );
  };

  return (
    <Box
      ref={welcomeRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        setIsWelcomeFocused(true);
        setFocusedComponent('welcome');
        if (navigationMode === 'accordions') {
          speakOnFocus('Pantalla de bienvenida a Code Flow. Usa Tab para navegar entre secciones. Presiona Enter para expandir una sección. Presiona Escape para salir.');
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsWelcomeFocused(false);
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
        outline: isWelcomeFocused ? `3px solid ${themeColors.accent}` : 'none',
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
      aria-label="Pantalla de bienvenida a Code Flow"
    >
      <Paper
        elevation={3}
        sx={{
          backgroundColor: themeColors.surface,
          color: themeColors.text,
          border: `2px solid ${themeColors.border}`,
          borderRadius: 3,
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
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
            Bienvenido a Code Flow
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
            Un entorno de desarrollo integrado accesible para Python
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
            Usa Tab para navegar entre secciones y Enter para expandir. Escape para salir.
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
          <Typography
            variant="h5"
            sx={{ 
              color: themeColors.accent, 
              fontWeight: 'bold', 
              mb: 2,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              wordBreak: 'break-word'
            }}
          >
            ¡Estás listo para comenzar!
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: themeColors.text, 
              mb: 2,
              wordBreak: 'break-word',
              px: { xs: 1, sm: 2 }
            }}
          >
            Presiona <Chip label="Alt + 2" size="small" sx={{ backgroundColor: themeColors.accent, color: contrast === 'high-contrast' ? '#000' : '#fff', fontWeight: 'bold' }} /> 
            {' '}o di <strong>"archivos"</strong> para crear tu primer archivo
          </Typography>
          <Box sx={{ p: 2, backgroundColor: themeColors.background, borderRadius: 1, border: `1px solid ${themeColors.border}` }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: themeColors.warning, 
                fontWeight: 'bold',
                wordBreak: 'break-word'
              }}
            >
              Recuerda: Presiona Alt más B o di "guía" para volver a esta ayuda en cualquier momento
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
});

export default WelcomeScreen;