import { google } from 'googleapis'
import { calculateTemplateSimilarity } from './similarity-detection'

// Google Sheets API 配置
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
})

const sheets = google.sheets({ version: 'v4', auth })

export interface VideoTemplate {
  templateId: string
  templateName: string
  productName: string
  structure: string
  hookPool: string
  videoStylePool: string
  tonePool: string
  suggestedLength: string
  recommendedCategories: string
  targetCountries: string
  templatePrompt: string
  notes: string
}

export async function fetchTemplatesFromSheet(): Promise<VideoTemplate[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1q_ZqVw4DVRbcAA78ZVndXq4XcFEySNmRoLHiFkllFls',
      range: 'TTS_video_master!A2:Z1000', // 从第2行开始，跳过标题
    })

    const rows = response.data.values || []
    const templates: VideoTemplate[] = []

    for (const row of rows) {
      if (row[0] && row[0].startsWith('TMP')) { // 只处理模板行
        templates.push({
          templateId: row[0] || '',
          templateName: row[1] || '',
          productName: row[2] || '',
          structure: row[3] || '',
          hookPool: row[4] || '',
          videoStylePool: row[5] || '',
          tonePool: row[6] || '',
          suggestedLength: row[7] || '',
          recommendedCategories: row[8] || '',
          targetCountries: row[9] || '',
          templatePrompt: row[10] || '',
          notes: row[11] || '',
        })
      }
    }

    return templates
  } catch (error) {
    console.error('Error fetching templates from Google Sheets:', error)
    throw error
  }
}

// 检测重复模板
export function detectDuplicateTemplates(templates: VideoTemplate[], similarityThreshold: number = 80) {
  const duplicates: Array<{
    template1: string
    template2: string
    similarity: number
    reason: string[]
  }> = []

  for (let i = 0; i < templates.length; i++) {
    for (let j = i + 1; j < templates.length; j++) {
      const template1 = templates[i]
      const template2 = templates[j]
      
      const { similarity, reasons } = calculateTemplateSimilarity(template1, template2)
      
      if (similarity >= similarityThreshold) {
        
        // 分析相似原因
        if (template1.templateName === template2.templateName) {
          reasons.push('模板名称相同')
        }
        if (template1.structure === template2.structure) {
          reasons.push('结构相同')
        }
        if (template1.tonePool === template2.tonePool) {
          reasons.push('语调池相同')
        }
        if (template1.videoStylePool === template2.videoStylePool) {
          reasons.push('视频风格池相同')
        }
        
        duplicates.push({
          template1: template1.templateId,
          template2: template2.templateId,
          similarity,
          reason: reasons
        })
      }
    }
  }

  return duplicates
}

// 合并相似模板
export function mergeSimilarTemplates(template1: VideoTemplate, template2: VideoTemplate): VideoTemplate {
  return {
    templateId: `MERGED_${template1.templateId}_${template2.templateId}`,
    templateName: `${template1.templateName} (合并)`,
    productName: template1.productName || template2.productName,
    structure: template1.structure || template2.structure,
    hookPool: `${template1.hookPool}, ${template2.hookPool}`,
    videoStylePool: `${template1.videoStylePool}, ${template2.videoStylePool}`,
    tonePool: `${template1.tonePool}, ${template2.tonePool}`,
    suggestedLength: template1.suggestedLength || template2.suggestedLength,
    recommendedCategories: `${template1.recommendedCategories}, ${template2.recommendedCategories}`,
    targetCountries: `${template1.targetCountries}, ${template2.targetCountries}`,
    templatePrompt: `${template1.templatePrompt}\n\n---\n\n${template2.templatePrompt}`,
    notes: `合并自: ${template1.templateId} + ${template2.templateId}`
  }
}

export async function syncTemplatesToDatabase() {
  const templates = await fetchTemplatesFromSheet()
  
  // 检测重复模板
  const duplicates = detectDuplicateTemplates(templates, 80)
  
  return {
    templates,
    duplicates
  }
}
