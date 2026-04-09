export type AIProvider = 'anthropic' | 'openai' | 'gemini'

export type AITaskType = 'eco' | 'creative' | 'reasoning'

export interface AIGenerationRequest {
  systemPrompt?: string
  prompt: string
  taskType: AITaskType
  /** Opt-in for forcing a specific provider, bypassing the router logic */
  forceProvider?: AIProvider
  temperature?: number
}

export interface AIGenerationResponse {
  content: string
  provider: AIProvider
  modelUsed: string
  error?: string
}

export interface AIRouterConfig {
  anthropicKey?: string
  openaiKey?: string
  geminiKey?: string
}
