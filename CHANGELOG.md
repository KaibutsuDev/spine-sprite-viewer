# Historial de Cambios Recientes (Changelog)

Este documento registra las mejoras, adaptaciones y correcciones críticas aplicadas al visor AetherSpine.

---

## [1.2.0] - 2026-06-15

### 🚀 Nuevas Características
- **Barra de Control Docked (Bottom Control Bar)**: Se rediseñó la experiencia de usuario trasladando los controles dinámicos del sprite (lista de acciones, loop, botón cargar, selector de skin y velocidad de reproducción) a una barra inferior acoplada, manteniendo la barra lateral limpia exclusivamente para la carga de modelos, presets y configuraciones de fondo.
- **Control de Velocidad de Reproducción**: Se agregó un control deslizante de `0.1x` a `3.0x` para acelerar o ralentizar la animación en tiempo real.
- **Refactorización Arquitectónica Modular**: Se introdujo el patrón *Adapter* para los cargadores de Spine (`Spine36Adapter`, `SpinePlayerAdapter`, `SpineAdapterFactory` y `SpineCDNLoader`), aislando la inicialización WebGL nativa de la lógica de React.

### 🧹 Limpieza de Workspace
- Se eliminaron todos los archivos obsoletos, duplicados y scripts de desarrollo no utilizados (`src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `public/icons.svg`, `scratch_check.js`, `read_skel_version.js`, `temp-main.min.js`, etc.) para optimizar el peso del repositorio.

---

## [1.1.0] - 2026-06-15

### 🚀 Nuevas Características
- **Modelos de Prueba Integrados**: Se agregó una sección en la barra lateral ("Modelos de Prueba") para cargar al instante presets almacenados en la carpeta `public/sprite`:
  - **Spineboy Pro** (Spine 4.3 - Binario `.skel`)
  - **Model 100111** (Spine 3.6 - Binario `.skel`)
  - **Hero Princess Knight** (Spine 3.6 - Binario `.skel.txt`)
- **Carga Dinámica On-Demand**: Implementación de descargas asíncronas en memoria que convierten los assets del servidor a URLs base64 en tiempo real para no alterar el cargador offline.

### 🛠️ Correcciones de Errores (Bug Fixes)
- **Corrección de Inicialización Spine 3.6**: 
  - Se reemplazó el constructor inexistente `spine.Atlas` por `spine.TextureAtlas` utilizando el callback correcto de carga de texturas requerido por la versión 3.6.
  - Se implementó la vinculación del shader WebGL (`shader.bind()`) y la asignación obligatoria de las matrices uniformes MVP (`MVP_MATRIX`) en el ciclo de renderizado de la versión 3.6, solucionando el error `drawElements: no valid shader program in use`.
  - Se añadió cálculo automático de límites (`getBounds`) y auto-centrado/escalado de cámara en Spine 3.6 para que los sprites se enfoquen perfectamente en pantalla.
- **Prevención de Caídas/Bloqueos de React (RangeError)**:
  - **Uso de `useRef`**: Se migró el objeto complejo y circular `playerInstance` del estado de React (`useState`) a una referencia persistente (`useRef`). Esto evita que herramientas de desarrollo como React DevTools intenten inspeccionar recursivamente la instancia del reproductor WebGL, previniendo caídas por desbordamiento de pila (`RangeError: Maximum call stack size exceeded`).
- **Limpieza Transicional de Dos Fases**:
  - Al alternar entre modelos, la aplicación ahora vacía primero todos los estados del visor para asegurar el desmontaje completo y la ejecución del método `dispose` del reproductor Spine anterior antes de instanciar el siguiente modelo.
