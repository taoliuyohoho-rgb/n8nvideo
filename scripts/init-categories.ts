import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化类目数据...')

  // 创建默认类目
  const defaultCategory = await prisma.category.upsert({
    where: { id: 'default-category' },
    update: {},
    create: {
      id: 'default-category',
      name: '默认类目',
      description: '系统默认类目',
      level: 1,
      targetMarket: '全球市场',
      isActive: true
    }
  })

  // 创建一些常见的商品类目
  const categories = [
    {
      id: 'electronics',
      name: '电子产品',
      description: '手机、电脑、耳机等电子设备',
      level: 1,
      targetMarket: '全球市场'
    },
    {
      id: 'beauty',
      name: '美妆护肤',
      description: '化妆品、护肤品、个人护理用品',
      level: 1,
      targetMarket: '全球市场'
    },
    {
      id: 'fashion',
      name: '时尚服饰',
      description: '服装、鞋包、配饰等时尚用品',
      level: 1,
      targetMarket: '全球市场'
    },
    {
      id: 'home',
      name: '家居生活',
      description: '家具、家电、生活用品',
      level: 1,
      targetMarket: '全球市场'
    },
    {
      id: 'sports',
      name: '运动户外',
      description: '运动装备、户外用品、健身器材',
      level: 1,
      targetMarket: '全球市场'
    },
    {
      id: 'food',
      name: '食品饮料',
      description: '食品、饮料、保健品',
      level: 1,
      targetMarket: '全球市场'
    }
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: {
        ...category,
        isActive: true
      }
    })
    console.log(`创建类目: ${category.name}`)
  }

  // 创建一些子类目
  const subCategories = [
    {
      id: 'smartphones',
      name: '智能手机',
      description: '各类智能手机及配件',
      parentId: 'electronics',
      level: 2,
      targetMarket: '全球市场'
    },
    {
      id: 'laptops',
      name: '笔记本电脑',
      description: '各类笔记本电脑及配件',
      parentId: 'electronics',
      level: 2,
      targetMarket: '全球市场'
    },
    {
      id: 'audio',
      name: '音频设备',
      description: '耳机、音响、麦克风等音频设备',
      parentId: 'electronics',
      level: 2,
      targetMarket: '全球市场'
    },
    {
      id: 'skincare',
      name: '护肤用品',
      description: '面部护理、身体护理产品',
      parentId: 'beauty',
      level: 2,
      targetMarket: '全球市场'
    },
    {
      id: 'makeup',
      name: '彩妆用品',
      description: '化妆品、彩妆工具',
      parentId: 'beauty',
      level: 2,
      targetMarket: '全球市场'
    }
  ]

  for (const subCategory of subCategories) {
    await prisma.category.upsert({
      where: { id: subCategory.id },
      update: {},
      create: {
        ...subCategory,
        isActive: true
      }
    })
    console.log(`创建子类目: ${subCategory.name}`)
  }

  console.log('类目数据初始化完成!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
