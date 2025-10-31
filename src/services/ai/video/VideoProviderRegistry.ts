import type { VideoGenerationProvider } from './VideoGenerationProvider'

class Registry {
  private providers: Map<string, VideoGenerationProvider> = new Map()

  register(provider: VideoGenerationProvider) {
    this.providers.set(provider.name.toLowerCase(), provider)
  }

  get(name: string): VideoGenerationProvider | undefined {
    return this.providers.get(name.toLowerCase())
  }
}

export const videoProviderRegistry = new Registry()


