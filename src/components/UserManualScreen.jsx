import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BugReportIcon from '@mui/icons-material/BugReport';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import MicIcon from '@mui/icons-material/Mic';
import ChatIcon from '@mui/icons-material/Chat';
import TerminalIcon from '@mui/icons-material/Terminal';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import WarningIcon from '@mui/icons-material/Warning';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { useScreenReader } from '../contexts/ScreenReaderContext';
import { useAppNavigation } from '../contexts/NavigationContext';
import { useInteractionMode } from '../contexts/InteractionModeContext';

const UserManualScreen = React.forwardRef(({ contrast, onClose }, ref) => {
  const { speak, speakOnFocus, speakOnHover, cancelHoverSpeak, stop } = useScreenReader();
  const { registerComponent, unregisterComponent, setFocusedComponent } = useAppNavigation();
  const manualRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [focusedAccordion, setFocusedAccordion] = useState(0);
  const accordionRefs = useRef([]);
  const [isManualFocused, setIsManualFocused] = useState(false);
  const [navigationMode, setNavigationMode] = useState('accordions');
  const [focusedStepIndex, setFocusedStepIndex] = useState(0);
  const stepRefs = useRef([]);
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
          success: '#00ff00',
          warning: '#ffaa00',
          error: '#ff4444',
          divider: '#333333',
          stepActive: '#ffeb3b',
          stepCompleted: '#00ff00',
          stepPending: '#666666'
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
          success: '#66BB6A',
          warning: '#FFB74D',
          error: '#EF5350',
          divider: '#21262d',
          stepActive: '#4FC3F7',
          stepCompleted: '#66BB6A',
          stepPending: '#555555'
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
          success: '#2E7D32',
          warning: '#F57C00',
          error: '#C62828',
          divider: '#F0F0F0',
          stepActive: '#D32F2F',
          stepCompleted: '#2E7D32',
          stepPending: '#9E9E9E'
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
          success: '#2e7d32',
          warning: '#ed6c02',
          error: '#d32f2f',
          divider: '#e0e0e0',
          stepActive: '#1976d2',
          stepCompleted: '#2e7d32',
          stepPending: '#9e9e9e'
        };
    }
  };

  const themeColors = getThemeColors(contrast);

  const manualMessage = `
    Manual de Usuario de Code Flow.
    Aquí encontrarás guías paso a paso para usar todas las funciones del IDE.
    
    Usa Tab para navegar entre las guías disponibles.
    Presiona Enter para expandir una guía y leer los pasos.
    Dentro de cada guía, usa Tab para navegar entre los pasos.
    Presiona Escape para cerrar esta pantalla o volver a las guías.
    
    Las guías disponibles son:
    1. Crear y gestionar archivos
    2. Ejecutar código Python
    3. Depurar código
    4. Usar el chat con el Copiloto
    5. Usar transcripción de voz
    6. Configurar accesibilidad
    7. Usar la terminal
    8. Atajos de teclado esenciales
  `;

  // Datos de las guías
  const guidesData = [
    {
      id: 'files',
      title: 'Crear y Gestionar Archivos',
      subtitle: 'Aprende a crear, abrir y organizar tus archivos',
      icon: FolderOpenIcon,
      steps: [
        {
          label: 'Crear un nuevo archivo',
          description: 'Ve al menú Archivos en la barra de navegación o presiona Ctrl+Alt+N. Selecciona "Nuevo archivo" para crear un archivo Python (.py) o "Nuevo archivo de texto" para un archivo .txt.',
          tip: 'También puedes decir "crear archivo" o "nuevo archivo" por voz.',
          shortcut: 'Ctrl + Alt + N'
        },
        {
          label: 'Nombrar el archivo',
          description: 'Escribe el nombre del archivo en el diálogo que aparece. Si no incluyes extensión, se añadirá .txt automáticamente. Para Python, escribe el nombre con .py al final.',
          tip: 'Usa nombres descriptivos como "mi_programa.py" o "notas.txt".',
          warning: 'Solo se permiten archivos .py y .txt'
        },
        {
          label: 'Abrir un archivo existente',
          description: 'Ve al menú Archivos y selecciona "Abrir un archivo" o presiona Ctrl+Alt+O. Navega hasta el archivo en tu computadora y selecciónalo.',
          tip: 'El archivo se abrirá automáticamente en el editor.',
          shortcut: 'Ctrl + Alt + O'
        },
        {
          label: 'Crear una carpeta',
          description: 'Ve al menú Archivos y selecciona "Abrir una carpeta" para importar una carpeta completa con sus archivos Python y de texto.',
          tip: 'Los archivos con otras extensiones serán ignorados automáticamente.',
          shortcut: 'Ctrl + Alt + F'
        },
        {
          label: 'Guardar cambios',
          description: 'Presiona Alt+S o usa el botón de guardar en el editor para guardar los cambios en tu archivo actual.',
          tip: 'El indicador de cambios sin guardar aparecerá junto al nombre del archivo.',
          shortcut: 'Alt + S'
        }
      ]
    },
    {
      id: 'execute',
      title: 'Ejecutar Código Python',
      subtitle: 'Cómo ejecutar y ver los resultados de tu código',
      icon: PlayArrowIcon,
      steps: [
        {
          label: 'Preparar tu código',
          description: 'Asegúrate de tener un archivo Python (.py) abierto en el editor con código válido. Guarda los cambios antes de ejecutar.',
          tip: 'Puedes escribir código directamente o usar transcripción de voz.',
          warning: 'Solo se pueden ejecutar archivos .py'
        },
        {
          label: 'Ejecutar el código',
          description: 'Presiona F5 o el botón de ejecutar (▶) en la barra del editor. También puedes decir "ejecutar" o "correr código" por voz.',
          tip: 'El atajo Alt+E también funciona para ejecutar.',
          shortcut: 'F5 o Alt + E'
        },
        {
          label: 'Ver la salida',
          description: 'Los resultados aparecerán en la terminal, en la pestaña "Salida". Aquí verás los prints, errores y cualquier output de tu programa.',
          tip: 'Presiona Alt+4 para ir directamente a la terminal.'
        },
        {
          label: 'Interactuar con el programa',
          description: 'Si tu programa requiere entrada del usuario (input), escríbela en el campo de la terminal y presiona Enter.',
          tip: 'La terminal indicará cuándo está esperando entrada.'
        },
        {
          label: 'Detener la ejecución',
          description: 'Si necesitas detener el programa, presiona F7 o el botón de detener (⏹). Para cancelar completamente, usa F8.',
          tip: 'Útil si tu programa tiene un bucle infinito.',
          shortcut: 'F7 (detener) o F8 (cancelar)'
        }
      ]
    },
    {
      id: 'debug',
      title: 'Depurar Código',
      subtitle: 'Encuentra y corrige errores en tu código',
      icon: BugReportIcon,
      steps: [
        {
          label: 'Identificar errores de sintaxis',
          description: 'El editor resalta los errores de sintaxis en rojo. Pasa el cursor sobre la línea marcada para ver el mensaje de error.',
          tip: 'Los errores comunes incluyen paréntesis sin cerrar, indentación incorrecta o variables no definidas.'
        },
        {
          label: 'Leer mensajes de error',
          description: 'Cuando ejecutas código con errores, la terminal muestra el traceback completo. Lee desde abajo hacia arriba para encontrar el origen del error.',
          tip: 'El número de línea te indica dónde está el problema.'
        },
        {
          label: 'Usar prints para depurar',
          description: 'Añade print() en puntos clave de tu código para ver el valor de las variables y entender el flujo del programa.',
          tip: 'Ejemplo: print(f"Variable x = {x}") para ver el valor de x.'
        },
        {
          label: 'Revisar la estructura del código',
          description: 'Ve a la pestaña "Estructura" en el panel izquierdo para ver las funciones y clases de tu código organizadas.',
          tip: 'Haz clic en un elemento para ir directamente a esa línea.'
        },
        {
          label: 'Pedir ayuda al Copiloto',
          description: 'Si no encuentras el error, usa el chat con el Copiloto. Describe el problema o pega el mensaje de error para obtener sugerencias.',
          tip: 'El Copiloto puede explicar errores y sugerir correcciones.'
        }
      ]
    },
    {
      id: 'chat',
      title: 'Usar el Chat con Copiloto',
      subtitle: 'Tu asistente de IA para programar',
      icon: ChatIcon,
      steps: [
        {
          label: 'Acceder al chat',
          description: 'Ve al panel izquierdo y selecciona la pestaña "Chat" o di "chat" o "copiloto" por voz. También puedes presionar Tab en el gestor de archivos hasta llegar al chat.',
          tip: 'El chat está siempre disponible mientras programas.'
        },
        {
          label: 'Hacer una pregunta',
          description: 'Escribe tu pregunta en el campo de texto y presiona Enter. Puedes preguntar sobre Python, pedir ejemplos de código o solicitar explicaciones.',
          tip: 'Sé específico en tus preguntas para obtener mejores respuestas.'
        },
        {
          label: 'Pedir ayuda con tu código',
          description: 'Puedes copiar y pegar código en el chat y pedir que te lo explique, lo mejore o encuentre errores.',
          tip: 'Usa frases como "explica este código" o "¿por qué da error?"'
        },
        {
          label: 'Generar código',
          description: 'Pide al Copiloto que genere código para tareas específicas. Por ejemplo: "crea una función que calcule el factorial".',
          tip: 'Revisa siempre el código generado antes de usarlo.'
        },
        {
          label: 'Leer las respuestas',
          description: 'Las respuestas aparecen en el historial del chat. El código se muestra formateado y puedes copiarlo directamente.',
          tip: 'El lector de pantalla leerá las respuestas automáticamente.'
        }
      ]
    },
    {
      id: 'voice',
      title: 'Usar Transcripción de Voz',
      subtitle: 'Escribe código hablando',
      icon: MicIcon,
      steps: [
        {
          label: 'Activar la transcripción',
          description: 'Presiona F6 o el botón del micrófono en el editor. Di "transcribir" o "dictar" por voz para activarla.',
          tip: 'Asegúrate de que tu navegador tiene permiso para usar el micrófono.',
          shortcut: 'F6'
        },
        {
          label: 'Hablar claramente',
          description: 'Habla en español de forma clara y pausada. El sistema convertirá tu voz en texto que aparecerá en el editor.',
          tip: 'Habla en un ambiente silencioso para mejores resultados.'
        },
        {
          label: 'Dictar código Python',
          description: 'Para código, di las palabras clave en español o inglés. Por ejemplo: "print abre paréntesis comilla hola mundo comilla cierra paréntesis".',
          tip: 'Puedes decir "nueva línea" para saltar de línea.'
        },
        {
          label: 'Detener la transcripción',
          description: 'Presiona F6 nuevamente o di "detener transcripción" para finalizar.',
          tip: 'La transcripción se detiene automáticamente tras un silencio prolongado.'
        },
        {
          label: 'Revisar y corregir',
          description: 'Después de dictar, revisa el texto generado y haz las correcciones necesarias con el teclado.',
          tip: 'La transcripción puede requerir ajustes, especialmente para símbolos.'
        }
      ]
    },
    {
      id: 'accessibility',
      title: 'Configurar Accesibilidad',
      subtitle: 'Personaliza Code Flow para tus necesidades',
      icon: AccessibilityNewIcon,
      steps: [
        {
          label: 'Activar lector de pantalla',
          description: 'Presiona F2 o Alt+L para activar o desactivar el lector de pantalla integrado. Este leerá en voz alta los elementos mientras navegas.',
          tip: 'El lector funciona junto con lectores externos como NVDA o JAWS.',
          shortcut: 'F2 o Alt + L'
        },
        {
          label: 'Cambiar el contraste',
          description: 'Presiona F3 o Alt+C para cambiar entre temas de contraste: normal, alto contraste, azul y amarillo.',
          tip: 'El alto contraste es ideal para usuarios con baja visión.',
          shortcut: 'F3 o Alt + C'
        },
        {
          label: 'Ajustar el zoom',
          description: 'Usa Alt++ para aumentar el zoom y Alt+- para reducirlo. Esto afecta a toda la interfaz.',
          tip: 'Puedes ajustar el zoom hasta un 300%.',
          shortcut: 'Alt + + / Alt + -'
        },
        {
          label: 'Configurar apariencia',
          description: 'Ve a Ajustes > Apariencia para acceder a opciones avanzadas: tamaño del cursor, tamaño de fuente y lupa de pantalla.',
          tip: 'La lupa sigue al cursor y amplía la zona donde estás trabajando.'
        },
        {
          label: 'Navegación por teclado',
          description: 'Usa Tab para moverte entre elementos, Enter para activar, y las flechas para navegar dentro de listas y menús.',
          tip: 'Alt+1 al 4 te lleva directamente a cada sección del IDE.'
        }
      ]
    },
    {
      id: 'terminal',
      title: 'Usar la Terminal',
      subtitle: 'Interactúa con tus programas',
      icon: TerminalIcon,
      steps: [
        {
          label: 'Acceder a la terminal',
          description: 'La terminal está en la parte inferior de la pantalla. Presiona Alt+4 para enfocarla directamente.',
          tip: 'Puedes redimensionar la terminal arrastrando el borde superior.',
          shortcut: 'Alt + 4'
        },
        {
          label: 'Ver la salida del programa',
          description: 'La pestaña "Salida" muestra todo lo que imprime tu programa con print() y los mensajes de error.',
          tip: 'Los errores aparecen en rojo para identificarlos fácilmente.'
        },
        {
          label: 'Ingresar datos',
          description: 'Cuando tu programa usa input(), la terminal mostrará un campo para escribir. Escribe tu respuesta y presiona Enter.',
          tip: 'El prompt te indicará qué tipo de dato espera el programa.'
        },
        {
          label: 'Limpiar la terminal',
          description: 'Usa el botón de limpiar o Ctrl+L para borrar el contenido de la terminal y empezar limpio.',
          tip: 'Útil cuando tienes mucha salida acumulada.',
          shortcut: 'Ctrl + L'
        },
        {
          label: 'Navegar por la salida',
          description: 'Usa las flechas arriba y abajo para desplazarte por la salida. El lector de pantalla leerá el contenido.',
          tip: 'El scroll automático te lleva siempre a la salida más reciente.'
        }
      ]
    },
    {
      id: 'shortcuts',
      title: 'Atajos de Teclado Esenciales',
      subtitle: 'Trabaja más rápido con atajos',
      icon: KeyboardIcon,
      steps: [
        {
          label: 'Navegación rápida',
          description: 'Alt+1: Navbar, Alt+2: Archivos, Alt+3: Editor, Alt+4: Terminal. Estos atajos te llevan directamente a cada sección.',
          tip: 'Memoriza estos 4 atajos para navegar sin usar el ratón.',
          shortcut: 'Alt + 1/2/3/4'
        },
        {
          label: 'Ejecutar y depurar',
          description: 'F5: Ejecutar código, F6: Transcribir voz, F7: Detener ejecución, F8: Cancelar completamente.',
          tip: 'Las teclas F5-F8 controlan la ejecución de tu código.',
          shortcut: 'F5 / F6 / F7 / F8'
        },
        {
          label: 'Accesibilidad rápida',
          description: 'F2: Lector de pantalla, F3: Cambiar contraste, Alt+B: Ir a bienvenida, Alt+H: Mostrar ayuda.',
          tip: 'Estos atajos funcionan en cualquier parte del IDE.',
          shortcut: 'F2 / F3 / Alt+B / Alt+H'
        },
        {
          label: 'Gestión de archivos',
          description: 'Ctrl+Alt+N: Nuevo archivo, Ctrl+Alt+O: Abrir archivo, Alt+S: Guardar.',
          tip: 'El guardado automático no está activado, recuerda guardar frecuentemente.',
          shortcut: 'Ctrl+Alt+N / Ctrl+Alt+O / Alt+S'
        },
        {
          label: 'Comandos de voz',
          description: 'Además de los atajos, puedes decir comandos como "ejecutar", "guardar", "archivos", "terminal" para realizar acciones.',
          tip: 'Los comandos de voz funcionan en español y siempre están escuchando.'
        }
      ]
    }
  ];

  // Obtener pasos de la guía actual
  const getCurrentSteps = (guideId) => {
    const guide = guidesData.find(g => g.id === guideId);
    return guide ? guide.steps : [];
  };

  const handleKeyDown = (e) => {
    if (!isManualFocused) return;

    // Escape para salir
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      
      if (navigationMode === 'steps') {
        setNavigationMode('accordions');
        setExpanded(false);
        setFocusedStepIndex(0);
        speak('Guía cerrada. De vuelta a navegación de guías. Usa Tab para navegar entre guías.');
      } else {
        stop();
        setIsManualFocused(false);
        if (onClose) {
          onClose();
        }
        speak('Cerrando manual de usuario');
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
          const newIndex = (focusedAccordion + direction + guidesData.length) % guidesData.length;
          setFocusedAccordion(newIndex);
          
          const guide = guidesData[newIndex];
          const isExpanded = expanded === guide.id;
          speakOnFocus(
            `Guía ${newIndex + 1} de ${guidesData.length}: ${guide.title}. ${guide.subtitle}. 
            ${isExpanded ? 'Guía expandida' : 'Presiona Enter para expandir y ver los pasos'}. 
            Presiona Escape para cerrar el manual.`
          );
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          e.stopPropagation();
          const currentGuide = guidesData[focusedAccordion];
          const isCurrentlyExpanded = expanded === currentGuide.id;
          
          if (!isCurrentlyExpanded) {
            setExpanded(currentGuide.id);
            setNavigationMode('steps');
            setFocusedStepIndex(0);
            
            const steps = getCurrentSteps(currentGuide.id);
            const firstStep = steps[0];
            speak(
              `Guía expandida: ${currentGuide.title}. ${steps.length} pasos. 
              Usa Tab para navegar entre pasos. Presiona Escape para volver a las guías. 
              Paso 1: ${firstStep.label}. ${firstStep.description}`
            );
          } else {
            setExpanded(false);
            speak(`Guía colapsada: ${currentGuide.title}. Presiona Enter para expandir nuevamente.`);
          }
          break;

        default:
          break;
      }
    }
    // Navegación dentro de los pasos
    else if (navigationMode === 'steps') {
      const currentGuide = guidesData[focusedAccordion];
      const steps = getCurrentSteps(currentGuide.id);

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          e.stopPropagation();
          const direction = e.shiftKey ? -1 : 1;
          const newIndex = (focusedStepIndex + direction + steps.length) % steps.length;
          setFocusedStepIndex(newIndex);
          
          const step = steps[newIndex];
          let stepAnnouncement = `Paso ${newIndex + 1} de ${steps.length}: ${step.label}. ${step.description}`;
          if (step.tip) stepAnnouncement += ` Consejo: ${step.tip}`;
          if (step.shortcut) stepAnnouncement += ` Atajo: ${step.shortcut}`;
          if (step.warning) stepAnnouncement += ` Advertencia: ${step.warning}`;
          stepAnnouncement += ` Usa Tab para continuar. Presiona Escape para volver a las guías.`;
          
          speakOnFocus(stepAnnouncement);
          break;

        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          const currentStep = steps[focusedStepIndex];
          let fullDescription = `${currentStep.label}. ${currentStep.description}`;
          if (currentStep.tip) fullDescription += ` Consejo: ${currentStep.tip}`;
          if (currentStep.shortcut) fullDescription += ` Atajo de teclado: ${currentStep.shortcut}`;
          if (currentStep.warning) fullDescription += ` Advertencia: ${currentStep.warning}`;
          speak(fullDescription);
          break;

        default:
          break;
      }
    }
  };

  // Registrar componente
  useEffect(() => {
    const manualAPI = {
      focus: () => {
        if (manualRef.current) {
          setIsManualFocused(true);
          setNavigationMode('accordions');
          setExpanded(false);
          setFocusedAccordion(0);
          setFocusedStepIndex(0);
          manualRef.current.focus();
          setFocusedComponent('manual');
          
          setTimeout(() => {
            speak(manualMessage, { rate: 1.1 });
          }, 100);
        }
      },
      blur: () => {
        setIsManualFocused(false);
        setNavigationMode('accordions');
        setExpanded(false);
        setFocusedStepIndex(0);
        stop();
      }
    };

    registerComponent('manual', manualAPI);

    return () => {
      unregisterComponent('manual');
      setIsManualFocused(false);
      stop();
    };
  }, [registerComponent, unregisterComponent, speak, setFocusedComponent, stop, manualMessage]);

  React.useImperativeHandle(ref, () => ({
    focus: () => {
      if (manualRef.current) {
        setIsManualFocused(true);
        setNavigationMode('accordions');
        setExpanded(false);
        setFocusedAccordion(0);
        setFocusedStepIndex(0);
        manualRef.current.focus();
        setFocusedComponent('manual');
        setTimeout(() => {
          speak(manualMessage, { rate: 1.1 });
        }, 100);
      }
    },
    blur: () => {
      setIsManualFocused(false);
      setNavigationMode('accordions');
      setExpanded(false);
      setFocusedStepIndex(0);
      stop();
    }
  }), [setFocusedComponent, speak, stop, manualMessage]);

  const AccordionSection = ({ id, index, icon: Icon, title, subtitle, children }) => {
    const isFocused = focusedAccordion === index && isManualFocused && navigationMode === 'accordions';
    const isExpanded = expanded === id;

    const handleAccordionClick = (event) => {
      if (event.detail === 0) return;
      
      if (isMouseMode) {
        const newExpanded = isExpanded ? false : id;
        setExpanded(newExpanded);
        
        if (newExpanded) {
          setNavigationMode('steps');
          setFocusedAccordion(index);
          setFocusedStepIndex(0);
          
          const steps = getCurrentSteps(id);
          speak(`Guía expandida: ${title}. ${steps.length} pasos.`);
        } else {
          setNavigationMode('accordions');
          setFocusedStepIndex(0);
          speak(`Guía colapsada: ${title}.`);
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

  // Renderizar contenido de cada guía (pasos)
  const renderGuideSteps = (guideId) => {
    const steps = getCurrentSteps(guideId);
    
    return (
      <Stepper 
        orientation="vertical" 
        activeStep={-1}
        sx={{
          '& .MuiStepConnector-line': {
            borderColor: themeColors.border
          }
        }}
      >
        {steps.map((step, index) => {
          const isFocused = navigationMode === 'steps' && focusedStepIndex === index;
          
          return (
            <Step 
              key={index} 
              active={true}
              ref={(el) => {
                if (navigationMode === 'steps') {
                  stepRefs.current[index] = el;
                }
              }}
            >
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: isFocused ? themeColors.stepActive : themeColors.stepPending,
                      color: isFocused ? (contrast === 'high-contrast' || contrast === 'yellow-contrast' ? '#000' : '#fff') : themeColors.text,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {index + 1}
                  </Box>
                )}
                sx={{
                  '& .MuiStepLabel-label': {
                    color: themeColors.text,
                    fontWeight: isFocused ? 'bold' : 'normal'
                  }
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: isFocused ? themeColors.accent : themeColors.text,
                    fontWeight: isFocused ? 'bold' : 'medium'
                  }}
                >
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent
                sx={{
                  borderColor: themeColors.border,
                  pl: 2,
                  outline: isFocused ? `2px solid ${themeColors.accent}` : 'none',
                  outlineOffset: '4px',
                  borderRadius: 1,
                  backgroundColor: isFocused ? `${themeColors.hover}40` : 'transparent',
                  transition: 'all 0.2s ease',
                  py: isFocused ? 1 : 0
                }}
                onMouseEnter={() => {
                  if (isMouseMode) {
                    let announcement = `Paso ${index + 1}: ${step.label}. ${step.description}`;
                    if (step.shortcut) announcement += ` Atajo: ${step.shortcut}`;
                    speakOnHover(announcement);
                  }
                }}
                onMouseLeave={() => {
                  if (isMouseMode) {
                    cancelHoverSpeak();
                  }
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: themeColors.textSecondary, 
                    mb: 2,
                    lineHeight: 1.6
                  }}
                >
                  {step.description}
                </Typography>

                {/* Tips, shortcuts y warnings */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {step.tip && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: 1,
                      p: 1,
                      backgroundColor: `${themeColors.info}20`,
                      borderRadius: 1,
                      border: `1px solid ${themeColors.info}40`
                    }}>
                      <LightbulbIcon sx={{ color: themeColors.info, fontSize: 20, mt: 0.2 }} />
                      <Typography variant="body2" sx={{ color: themeColors.text }}>
                        <strong>Consejo:</strong> {step.tip}
                      </Typography>
                    </Box>
                  )}

                  {step.shortcut && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      p: 1,
                      backgroundColor: `${themeColors.success}20`,
                      borderRadius: 1,
                      border: `1px solid ${themeColors.success}40`
                    }}>
                      <KeyboardIcon sx={{ color: themeColors.success, fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: themeColors.text }}>
                        <strong>Atajo:</strong>{' '}
                        <Chip 
                          label={step.shortcut}
                          size="small"
                          sx={{ 
                            backgroundColor: themeColors.accent,
                            color: contrast === 'high-contrast' || contrast === 'yellow-contrast' ? '#000' : '#fff',
                            fontWeight: 'bold',
                            fontFamily: 'monospace'
                          }}
                        />
                      </Typography>
                    </Box>
                  )}

                  {step.warning && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: 1,
                      p: 1,
                      backgroundColor: `${themeColors.warning}20`,
                      borderRadius: 1,
                      border: `1px solid ${themeColors.warning}40`
                    }}>
                      <WarningIcon sx={{ color: themeColors.warning, fontSize: 20, mt: 0.2 }} />
                      <Typography variant="body2" sx={{ color: themeColors.text }}>
                        <strong>Importante:</strong> {step.warning}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    );
  };

  return (
    <Box
      ref={manualRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        setIsManualFocused(true);
        setFocusedComponent('manual');
        if (navigationMode === 'accordions') {
          speakOnFocus('Manual de usuario. Usa Tab para navegar entre guías. Presiona Enter para expandir una guía. Presiona Escape para cerrar.');
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsManualFocused(false);
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
        outline: isManualFocused ? `3px solid ${themeColors.accent}` : 'none',
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
      aria-label="Manual de usuario de Code Flow"
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
            <MenuBookIcon sx={{ fontSize: 48, color: themeColors.accent }} />
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
            Manual de Usuario
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
            Guías paso a paso para aprovechar al máximo Code Flow
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
            Usa Tab para navegar entre guías y Enter para expandir. Escape para cerrar.
          </Typography>
        </Box>

        {/* Guías */}
        {guidesData.map((guide, index) => (
          <AccordionSection
            key={guide.id}
            id={guide.id}
            index={index}
            icon={guide.icon}
            title={guide.title}
            subtitle={guide.subtitle}
          >
            {renderGuideSteps(guide.id)}
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
              <strong>¿Necesitas más ayuda?</strong> Usa el chat con el Copiloto para preguntas específicas.
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
              para cerrar el manual o <Chip label="Alt + B" size="small" sx={{ backgroundColor: themeColors.accent, color: contrast === 'high-contrast' || contrast === 'yellow-contrast' ? '#000' : '#fff', fontWeight: 'bold', mx: 0.5 }} /> 
              para ir a la bienvenida
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
});

export default UserManualScreen;