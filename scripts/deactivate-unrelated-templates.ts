#!/usr/bin/env tsx

import { prisma } from '@/lib/prisma'

const allowedKeywords = [
  '3C',
  'Consumer Electronics',
  'Beauty',
  'Makeup',
  'Personal Care',
  'Kitchen',
  'Cookware',
  'Health',
  'Wellness',
  'Books',
]

function matchesAllowed(text: string | null | undefined): boolean {
  if (!text) return false
  const t = text.toLowerCase()
  return allowedKeywords.some(k => t.includes(k.toLowerCase()))
}

async function main() {
  const templates = await prisma.template.findMany({})
  let deactivateCount = 0
  for (const tpl of templates) {
    if (!matchesAllowed(tpl.recommendedCategories)) {
      if (tpl.isActive) {
        await prisma.template.update({ where: { id: tpl.id }, data: { isActive: false } })
        deactivateCount += 1
      }
    }
  }
  console.log(`Deactivated ${deactivateCount} templates not in allowed categories.`)
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e)
  process.exit(1)
})


