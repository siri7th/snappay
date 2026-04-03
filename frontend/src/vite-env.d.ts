// src/vite-env.d.ts
/// <reference types="vite/client" />

/**
 * Environment variable type definitions
 * Extend this interface to add type safety for your import.meta.env variables
 */
interface ImportMetaEnv {
  /** Backend API URL (e.g., http://localhost:5000/api) */
  readonly VITE_API_URL: string;
  
  /** WebSocket server URL for real-time features */
  readonly VITE_SOCKET_URL?: string;
  
  /** Application name displayed in UI */
  readonly VITE_APP_NAME?: string;
  
  /** Environment mode: 'development' | 'production' */
  readonly MODE: string;
  
  /** Base URL the app is being served from */
  readonly BASE_URL: string;
  
  /** Whether this is production mode */
  readonly PROD: boolean;
  
  /** Whether this is development mode */
  readonly DEV: boolean;
  
  /** Whether app is running on server (SSR) */
  readonly SSR: boolean;
}

/**
 * Extend ImportMeta interface to include our env types
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Global constants injected by Vite
 * Defined in vite.config.ts under 'define' option
 */
declare const __APP_VERSION__: string; // App version from package.json
declare const __DEV__: boolean;        // Alias for import.meta.env.DEV
declare const __PROD__: boolean;       // Alias for import.meta.env.PROD

/**
 * Asset module declarations for non-code files
 * Allows importing these file types in TypeScript
 */
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

/**
 * Web Worker module declaration
 * Allows importing workers with ?worker suffix
 */
declare module '*?worker' {
  const workerConstructor: new () => Worker;
  export default workerConstructor;
}

/**
 * Web Worker inline declaration
 * Allows importing workers with ?worker&inline suffix
 */
declare module '*?worker&inline' {
  const workerConstructor: new () => Worker;
  export default workerConstructor;
}