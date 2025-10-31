'use client'

import { PersonaGenerator } from '@/components/PersonaGenerator'

export default function PersonaGenerationPage() {
  const handlePersonaGenerated = (persona: any) => {
    console.log('人设生成完成:', persona)
  }

  const handlePersonaSaved = (personaId: string) => {
    console.log('人设保存完成:', personaId)
    // 可以在这里添加成功提示或跳转逻辑
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PersonaGenerator 
        onPersonaGenerated={handlePersonaGenerated}
        onPersonaSaved={handlePersonaSaved}
      />
    </div>
  )
}
