export const PROVIDER_IDS = ['anthropic', 'openai'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]
export type KeyPersistence = 'local' | 'session'

export interface ProviderConnectionSettings {
  baselineModel: string
  dailyModel: string
  keyPersistence: KeyPersistence
}

export const DEFAULT_PROVIDER: ProviderId = 'anthropic'

export const PROVIDERS: Record<ProviderId, {
  label: string
  judgeLabel: string
  keyLabel: string
  keyPlaceholder: string
  defaults: ProviderConnectionSettings
}> = {
  anthropic: {
    label: 'Anthropic',
    judgeLabel: 'Claude',
    keyLabel: 'Anthropic API key',
    keyPlaceholder: 'sk-ant-…',
    defaults: {
      baselineModel: 'claude-sonnet-5',
      dailyModel: 'claude-haiku-4-5-20251001',
      keyPersistence: 'local'
    }
  },
  openai: {
    label: 'OpenAI',
    judgeLabel: 'OpenAI',
    keyLabel: 'OpenAI API key',
    keyPlaceholder: 'sk-…',
    defaults: {
      baselineModel: 'gpt-5.6-terra',
      dailyModel: 'gpt-5.6-luna',
      keyPersistence: 'local'
    }
  }
}

export function createDefaultProviderSettings(): Record<ProviderId, ProviderConnectionSettings> {
  return {
    anthropic: { ...PROVIDERS.anthropic.defaults },
    openai: { ...PROVIDERS.openai.defaults }
  }
}
