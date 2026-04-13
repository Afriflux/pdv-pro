import { Anthropic } from '@anthropic-ai/sdk'
import { createAdminClient } from '../supabase/admin'
import { AIGenerationRequest, AIGenerationResponse, AIProvider } from './types'

export interface AIRouterConfig {
  anthropicKey?: string
  openaiKey?: string
  geminiKey?: string
  routingPrefs?: Record<string, string[]>
}

// Revalidate this cache config frequently or fetch directly
async function getAIConfig(): Promise<AIRouterConfig> {
  const supabase = createAdminClient()
  const { data: keys } = await supabase
    .from('IntegrationKey')
    .select('key, value')
    .in('key', ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY'])
  
  const { data: routingPrefsRow } = await supabase
    .from('PlatformConfig')
    .select('value')
    .eq('key', 'AI_ROUTING_PREFS')
    .single()

  const config: AIRouterConfig = {
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    openaiKey: process.env.OPENAI_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY,
  }
  
  if (keys) {
    for (const k of keys) {
      if (k.key === 'ANTHROPIC_API_KEY' && k.value) config.anthropicKey = k.value
      if (k.key === 'OPENAI_API_KEY' && k.value) config.openaiKey = k.value
      if (k.key === 'GEMINI_API_KEY' && k.value) config.geminiKey = k.value
    }
  }
  if (routingPrefsRow?.value) {
    try {
       config.routingPrefs = JSON.parse(routingPrefsRow.value)
    } catch(e) { console.warn('[AI Router] Failed to parse routing prefs:', e) }
  }

  return config
}

// ─── MODEL CALLERS ─────────────────────────────────────────────────────────────

async function callAnthropic(
  apiKey: string, 
  req: AIGenerationRequest, 
  model: string = 'claude-3-haiku-20240307'
): Promise<AIGenerationResponse> {
  const client = new Anthropic({ apiKey })
  
  const response = await client.messages.create({
    model,
    max_tokens: 4000,
    system: req.systemPrompt,
    messages: [{ role: 'user', content: req.prompt }],
    temperature: req.temperature ?? 0.7,
  })

  // Extract text safely depending on block types
  const textBlock = response.content.find(c => c.type === 'text')
  
  return {
    content: textBlock && 'text' in textBlock ? textBlock.text : '',
    provider: 'anthropic',
    modelUsed: model,
  }
}

async function callOpenAI(
  apiKey: string, 
  req: AIGenerationRequest, 
  model: string = 'gpt-4o-mini'
): Promise<AIGenerationResponse> {
  const messages = []
  if (req.systemPrompt) {
    messages.push({ role: 'system', content: req.systemPrompt })
  }
  messages.push({ role: 'user', content: req.prompt })

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: 4000
    })
  })

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    throw new Error(errorJson.error?.message || `OpenAI Error: ${res.statusText}`)
  }

  const data = await res.json()
  return {
    content: data.choices?.[0]?.message?.content || '',
    provider: 'openai',
    modelUsed: model,
  }
}

async function callGemini(
  apiKey: string, 
  req: AIGenerationRequest, 
  model: string = 'gemini-1.5-flash'
): Promise<AIGenerationResponse> {
  // Construct a structure suitable for the Gemini API v1beta
  const contents = [
    {
      role: 'user',
      parts: [
        { text: req.systemPrompt ? `${req.systemPrompt}\n\n${req.prompt}` : req.prompt }
      ]
    }
  ]

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: req.temperature ?? 0.7,
        maxOutputTokens: 4000,
      }
    })
  })

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    throw new Error(errorJson.error?.message || `Gemini Error: ${res.statusText}`)
  }

  const data = await res.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  
  return {
    content,
    provider: 'gemini',
    modelUsed: model,
  }
}

// ─── ROUTER LOGIC ─────────────────────────────────────────────────────────────

/**
 * Priorities definitions
 */
const ROUTING_PREFERENCES: Record<string, { provider: AIProvider, model: string }[]> = {
  eco: [
    { provider: 'gemini', model: 'gemini-1.5-flash' },
    { provider: 'openai', model: 'gpt-4o-mini' },
    { provider: 'anthropic', model: 'claude-3-haiku-20240307' },
  ],
  creative: [
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20240620' },
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'gemini', model: 'gemini-1.5-pro' },
  ],
  reasoning: [
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20240620' },
    { provider: 'gemini', model: 'gemini-1.5-pro' },
  ]
}

export async function generateAIResponse(req: AIGenerationRequest): Promise<AIGenerationResponse> {
  const config = await getAIConfig()

  // Find the exact plan to follow
  const dbRoutingMap = config.routingPrefs || {}
  
  // Create a priority array based on UI preferences or fallback to hardcoded
  let plan = []
  
  if (dbRoutingMap[req.taskType]) {
    // If we have dynamic preferences array: ['gemini', 'openai', 'anthropic']
    // We map it back to the { provider, model } format
    const fallbackMap: Record<string, string> = {
      'gemini': 'gemini-1.5-flash',
      'openai': 'gpt-4o-mini',
      'anthropic': 'claude-3-haiku-20240307'
    }
    // High tier fallback models for creative/reasoning
    if (req.taskType === 'creative' || req.taskType === 'reasoning') {
      fallbackMap['gemini'] = 'gemini-1.5-pro'
      fallbackMap['openai'] = 'gpt-4o'
      fallbackMap['anthropic'] = 'claude-3-5-sonnet-20240620'
    }

    plan = dbRoutingMap[req.taskType].map((prov: string) => ({
      provider: prov as AIProvider,
      model: fallbackMap[prov] || fallbackMap['openai']
    }))
  } else {
    // Hardcoded fallback
    plan = ROUTING_PREFERENCES[req.taskType] || ROUTING_PREFERENCES['eco']
  }

  if (req.forceProvider) {
    plan = plan.filter((p: { provider: string, model: string }) => p.provider === req.forceProvider)
    if (plan.length === 0) {
       throw new Error(`Provider ${req.forceProvider} was forced but isn't available for this task.`)
    }
  }

  // Sequentially try the providers based on the priority chain
  let lastError: Error | undefined
  
  for (const step of plan) {
    try {
      if (step.provider === 'gemini' && config.geminiKey) {
        return await callGemini(config.geminiKey, req, step.model)
      }
      
      if (step.provider === 'openai' && config.openaiKey) {
        return await callOpenAI(config.openaiKey, req, step.model)
      }

      if (step.provider === 'anthropic' && config.anthropicKey) {
        return await callAnthropic(config.anthropicKey, req, step.model)
      }

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.warn(`[AI Router] Provider ${step.provider} failed:`, errMsg)
      lastError = err instanceof Error ? err : new Error(errMsg)
      // Continue to the next provider in the fallback chain!
    }
  }

  if (lastError) {
    throw new Error(`All configured AI providers failed. Last Error: ${lastError.message}`)
  } else {
    throw new Error(`No valid AI API keys found in configuration to fulfill the request.`)
  }
}
