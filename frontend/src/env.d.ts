/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API Gateway HTTP API. Unset until Sprint 1. */
  readonly VITE_API_URL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
