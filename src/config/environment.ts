/**
 * Environment configuration for the application
 */

interface EnvironmentConfig {
  // API URLs
  aiServiceUrl: string
  backendUrl: string

  // Feature flags
  enableDebugMode: boolean
  enableMockData: boolean

  // AI Configuration
  streamingEnabled: boolean

  // File handling
  maxFileSize: number
  supportedFileTypes: string[]

  // UI Configuration
  defaultTheme: 'light' | 'dark'
  animationsEnabled: boolean
}

const config: EnvironmentConfig = {
  // API URLs - use environment variables with fallbacks
  aiServiceUrl: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000',
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3030',

  // Feature flags
  enableDebugMode: process.env.NODE_ENV === 'development',
  enableMockData: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true',

  // AI Configuration
  streamingEnabled: process.env.NEXT_PUBLIC_STREAMING_ENABLED !== 'false',

  // File handling
  maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'), // 10MB default
  supportedFileTypes: [
    '.ts', '.tsx', '.js', '.jsx',
    '.json', '.md', '.txt', '.env',
    '.py', '.java', '.go', '.rs',
    '.html', '.css', '.scss', '.less',
    '.yml', '.yaml', '.toml', '.ini'
  ],
  
  // UI Configuration
  defaultTheme: (process.env.NEXT_PUBLIC_DEFAULT_THEME as 'light' | 'dark') || 'light',
  animationsEnabled: process.env.NEXT_PUBLIC_ANIMATIONS_ENABLED !== 'false'
}

// Validation
if (!config.aiServiceUrl) {
  console.warn('AI_SERVICE_URL not configured, using default localhost')
}

if (!config.backendUrl) {
  console.warn('BACKEND_URL not configured, using default localhost')
}

export default config

// Helper functions
export const getBackendUrl = (endpoint: string) => {
  const baseUrl = config.backendUrl.replace(/\/$/, '')
  const cleanEndpoint = endpoint.replace(/^\//, '')
  return `${baseUrl}/${cleanEndpoint}`
}

// Export individual config values for convenience
export const {
  aiServiceUrl,
  backendUrl,
  enableDebugMode,
  enableMockData,
  streamingEnabled,
  maxFileSize,
  supportedFileTypes,
  defaultTheme,
  animationsEnabled
} = config