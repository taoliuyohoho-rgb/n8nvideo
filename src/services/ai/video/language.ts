export type LanguageCode =
  | 'en-US'
  | 'en-GB'
  | 'zh-CN'
  | 'ja-JP'
  | 'ko-KR'
  | 'th-TH'
  | 'id-ID'
  | 'vi-VN'
  | 'ar-SA'
  | 'ar-AE'
  | 'es-ES'
  | 'es-MX'
  | 'pt-BR'
  | 'fr-FR'
  | 'de-DE'
  | 'it-IT'
  | 'ru-RU'
  | 'tr-TR'
  | 'en-IN'

export interface ResolvedLanguages {
  instructionLang: LanguageCode
  voiceoverLang: LanguageCode
  screenTextLang: LanguageCode
}

export function mapCountryToLanguage(country: string): LanguageCode {
  const c = (country || '').toUpperCase()
  switch (c) {
    case 'CN':
    case 'CHN':
      return 'zh-CN'
    case 'US':
    case 'USA':
      return 'en-US'
    case 'GB':
    case 'UK':
      return 'en-GB'
    case 'JP':
    case 'JPN':
      return 'ja-JP'
    case 'KR':
    case 'KOR':
      return 'ko-KR'
    case 'TH':
      return 'th-TH'
    case 'ID':
      return 'id-ID'
    case 'VN':
    case 'VNM':
      return 'vi-VN'
    case 'SA':
      return 'ar-SA'
    case 'AE':
      return 'ar-AE'
    case 'ES':
      return 'es-ES'
    case 'MX':
      return 'es-MX'
    case 'BR':
      return 'pt-BR'
    case 'FR':
      return 'fr-FR'
    case 'DE':
      return 'de-DE'
    case 'IT':
      return 'it-IT'
    case 'RU':
      return 'ru-RU'
    case 'TR':
      return 'tr-TR'
    case 'IN':
      return 'en-IN'
    default:
      return 'en-US'
  }
}

export function resolveLanguages(provider: string | undefined, targetCountries: string[] | undefined): ResolvedLanguages {
  const providerName = (provider || '').toLowerCase()
  // Instruction language by provider
  const instructionLang: LanguageCode = providerName.includes('doubao')
    ? 'zh-CN'
    : 'en-US'

  // Voiceover/subtitles by target country rule
  let voiceoverLang: LanguageCode = 'en-US'
  const countries = Array.isArray(targetCountries) ? targetCountries : []
  if (countries.length === 1) {
    voiceoverLang = mapCountryToLanguage(countries[0])
  } else {
    voiceoverLang = 'en-US'
  }

  return {
    instructionLang,
    voiceoverLang,
    screenTextLang: voiceoverLang,
  }
}


