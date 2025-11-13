# IDE Accesible Codeflow - Frontend

Un entorno de desarrollo integrado (IDE) accesible diseñado para personas con discapacidad visual, construido con React.

## Descripción

Este proyecto es un IDE web accesible que proporciona herramientas de desarrollo adaptadas para usuarios con diferentes necesidades de accesibilidad. Incluye características como lector de pantalla, magnificación, alto contraste, navegación por voz y más.

## Características Principales

- **Editor de Código**: Editor de texto completo con resaltado de sintaxis
- **Gestor de Archivos**: Navegación y gestión de archivos del proyecto
- **Terminal Integrada**: Ejecuta comandos directamente desde el IDE
- **Depurador WebSocket**: Herramientas de debugging en tiempo real
- **Lector de Pantalla**: Soporte nativo para lectores de pantalla
- **Magnificador**: Herramienta de zoom para ampliar áreas específicas
- **Ajustes de Contraste**: Múltiples temas de alto contraste
- **Control de Zoom**: Ajuste del tamaño de fuente y elementos
- **Modo de Interacción**: Navegación por teclado y voz

## Instalación

### Prerequisitos

- Node.js (versión 14 o superior)
- npm o yarn

### Pasos de Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno (opcional):
Crea un archivo `.env` en la raíz del proyecto con las configuraciones necesarias.

4. Inicia el servidor de desarrollo:
```bash
npm start
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Scripts Disponibles

### `npm start`
Ejecuta la aplicación en modo desarrollo.

### `npm test`
Ejecuta las pruebas unitarias.

### `npm run build`
Crea una versión optimizada para producción en la carpeta `build`.

### `npm run eject`
**Nota**: Esta es una operación irreversible. Expone todas las configuraciones de Create React App.

## Pruebas

El proyecto incluye pruebas E2E con Cypress:

```bash
npx cypress open
```

Las pruebas de accesibilidad se encuentran en `cypress/e2e/Accesibilidad.cy.js`.

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── AppearanceModal.jsx
│   │   ├── Breadcrumbs.jsx
│   │   ├── Contrast.jsx
│   │   ├── Debug.jsx
│   │   ├── FileManager.jsx
│   │   ├── Magnifier.jsx
│   │   ├── Navbar.jsx
│   │   ├── Terminal.jsx
│   │   ├── TerminalTabs.jsx
│   │   ├── TextEditor.jsx
│   │   ├── Welcome.jsx
│   │   └── Zoom.jsx
│   ├── contexts/            # Contextos de React
│   │   ├── InteractionModeContext.js
│   │   ├── NavigationContext.js
│   │   └── ScreenReaderContext.js
│   ├── hooks/               # Custom hooks
│   │   └── useDebuggerWebSocket.js
│   ├── pages/               # Páginas principales
│   │   └── IDE.jsx
│   ├── styles/              # Archivos CSS
│   ├── utils/               # Utilidades
│   │   ├── axiosInstance.js
│   │   ├── chat.js
│   │   └── speech.js
│   └── App.js               # Componente principal
├── cypress/                 # Pruebas E2E
│   └── e2e/
│       └── Accesibilidad.cy.js
└── public/                  # Archivos estáticos
```

## Características de Accesibilidad

### Navegación por Teclado
- Atajos de teclado personalizables
- Focus visible en todos los elementos interactivos

### Soporte para Lectores de Pantalla
- Etiquetas ARIA apropiadas
- Anuncios de cambios de estado
- Descripción de elementos interactivos

### Personalización Visual
- Temas de alto contraste
- Ajuste de tamaño de fuente
- Magnificador de pantalla
- Espaciado configurable

## Tecnologías Utilizadas

- **React**: Biblioteca principal de UI
- **Create React App**: Configuración base del proyecto
- **Axios**: Cliente HTTP para llamadas a API
- **WebSocket**: Comunicación en tiempo real
- **Cypress**: Framework de testing E2E
- **React Context API**: Gestión de estado global



## Autores

- Universidad del Valle - Proyecto de Grado
- Estudiante Diana Marcela Cadena Moreno

Para preguntas o sugerencias, por favor abre un issue en el repositorio.
Este es un proyecto académico desarrollado como Trabajo de Grado en la Universidad del Valle.