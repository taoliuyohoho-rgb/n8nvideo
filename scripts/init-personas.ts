/**
 * 初始化人设数据脚本
 * 根据现有商品和类目生成多样化的人设
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 人设模板定义
interface PersonaTemplate {
  name: string
  description: string
  categories: string[]
  productNames?: string[]
  coreIdentity: {
    name: string
    age: number
    gender: string
    location: string
    occupation: string
  }
  look: {
    generalAppearance: string
    hair: string
    clothingAesthetic: string
    signatureDetails: string
  }
  vibe: {
    traits: string[]
    demeanor: string
    communicationStyle: string
  }
  context: {
    hobbies: string
    values: string
    frustrations: string
    homeEnvironment: string
  }
  targetCountries: string[]
  why: string
}

// 定义20个多样化的人设模板
const personaTemplates: PersonaTemplate[] = [
  // 1. 年轻职场人士 - 3C类目
  {
    name: '都市白领小王',
    description: '25-30岁的都市职场人士，追求高效与品质生活',
    categories: ['3C', '家庭日用'],
    productNames: ['电磁炉', '水杯'],
    coreIdentity: {
      name: '小王',
      age: 27,
      gender: '男',
      location: '北京',
      occupation: '互联网产品经理'
    },
    look: {
      generalAppearance: '干净利落，现代都市风',
      hair: '短发，清爽',
      clothingAesthetic: '商务休闲，简约时尚',
      signatureDetails: '黑框眼镜，智能手表'
    },
    vibe: {
      traits: ['高效', '理性', '追求品质'],
      demeanor: '自信从容',
      communicationStyle: '简洁直接，注重数据和效率'
    },
    context: {
      hobbies: '科技产品测评、健身、咖啡',
      values: '时间就是金钱，效率至上',
      frustrations: '低效的工具，浪费时间的事物',
      homeEnvironment: '一居室公寓，现代简约风格，智能家居'
    },
    targetCountries: ['CN', 'MY', 'SG'],
    why: '都市白领是3C产品和高品质日用品的核心消费群体'
  },

  // 2. 新手妈妈 - 家庭日用
  {
    name: '新手妈妈李女士',
    description: '28-35岁的年轻妈妈，注重安全与便利',
    categories: ['家庭日用', '3C'],
    productNames: ['水杯', '电磁炉'],
    coreIdentity: {
      name: '李女士',
      age: 32,
      gender: '女',
      location: '上海',
      occupation: '全职妈妈（原财务）'
    },
    look: {
      generalAppearance: '温柔亲和，舒适为主',
      hair: '中长发，简单马尾',
      clothingAesthetic: '休闲舒适，柔和色系',
      signatureDetails: '婴儿背带，购物袋'
    },
    vibe: {
      traits: ['细心', '负责', '注重安全'],
      demeanor: '温和耐心',
      communicationStyle: '详细咨询，关注细节和安全性'
    },
    context: {
      hobbies: '育儿知识学习、烘焙、母婴社群',
      values: '孩子的安全和健康第一',
      frustrations: '产品不安全、使用复杂、清洗麻烦',
      homeEnvironment: '三居室，温馨家庭风，有婴儿房'
    },
    targetCountries: ['CN', 'MY', 'TH'],
    why: '新手妈妈关注产品安全性和易用性，是家庭日用品的主要决策者'
  },

  // 3. 学生党 - 3C、文具、图书
  {
    name: '大学生小林',
    description: '18-22岁的在校大学生，性价比优先',
    categories: ['3C', '家庭日用', '图书文具'],
    productNames: ['水杯', '图书'],
    coreIdentity: {
      name: '小林',
      age: 20,
      gender: '女',
      location: '武汉',
      occupation: '大学生'
    },
    look: {
      generalAppearance: '青春活力，校园风',
      hair: '长发，马尾或散发',
      clothingAesthetic: '休闲运动，简约舒适',
      signatureDetails: '帆布包，耳机'
    },
    vibe: {
      traits: ['活力', '好奇', '追求性价比'],
      demeanor: '开朗友好',
      communicationStyle: '活泼直接，喜欢分享和种草'
    },
    context: {
      hobbies: '社交媒体、追剧、宿舍卧谈',
      values: '性价比、颜值、实用性',
      frustrations: '价格太贵、质量差、不好看',
      homeEnvironment: '大学宿舍，空间有限，追求实用和美观'
    },
    targetCountries: ['CN', 'MY', 'TH', 'VN'],
    why: '学生群体是性价比产品的主力军，注重口碑和社交分享'
  },

  // 4. 租房青年 - 家庭日用、小家电
  {
    name: '租房青年阿杰',
    description: '22-28岁的租房打工族，追求小而精',
    categories: ['3C', '家庭日用'],
    productNames: ['电磁炉', '水杯'],
    coreIdentity: {
      name: '阿杰',
      age: 25,
      gender: '男',
      location: '深圳',
      occupation: '设计师'
    },
    look: {
      generalAppearance: '文艺青年，个性化',
      hair: '中长发，微卷',
      clothingAesthetic: '休闲个性，注重设计感',
      signatureDetails: '单肩包，创意饰品'
    },
    vibe: {
      traits: ['独立', '追求个性', '注重设计'],
      demeanor: '自我但友善',
      communicationStyle: '感性表达，注重美感和体验'
    },
    context: {
      hobbies: '摄影、设计、探店',
      values: '生活质感、个人空间、美学',
      frustrations: '占地方、不好搬家、设计丑',
      homeEnvironment: '小户型出租屋，注重空间利用和颜值'
    },
    targetCountries: ['CN', 'MY', 'SG'],
    why: '租房青年需要小巧便携、高颜值的产品'
  },

  // 5. 中年家庭主妇 - 家庭日用
  {
    name: '家庭主妇陈姐',
    description: '35-45岁的家庭主妇，追求实惠和耐用',
    categories: ['家庭日用', '3C'],
    productNames: ['电磁炉', '水杯'],
    coreIdentity: {
      name: '陈姐',
      age: 40,
      gender: '女',
      location: '成都',
      occupation: '家庭主妇'
    },
    look: {
      generalAppearance: '朴实大方，舒适为主',
      hair: '短发，简单干练',
      clothingAesthetic: '居家舒适，实用为主',
      signatureDetails: '围裙，菜篮子'
    },
    vibe: {
      traits: ['节俭', '务实', '顾家'],
      demeanor: '热情周到',
      communicationStyle: '详细询价，关注实用性和性价比'
    },
    context: {
      hobbies: '做饭、家庭聚会、广场舞',
      values: '家庭和睦、物美价廉、耐用可靠',
      frustrations: '浪费钱、质量差、容易坏',
      homeEnvironment: '三居室，温馨家庭风，厨房设备齐全'
    },
    targetCountries: ['CN', 'MY', 'TH'],
    why: '家庭主妇是家庭日用品的主要采购者，注重性价比和耐用性'
  },

  // 6. 健身达人 - 水杯、运动周边
  {
    name: '健身教练小张',
    description: '25-35岁的健身爱好者，注重健康和品质',
    categories: ['家庭日用', '3C'],
    productNames: ['水杯'],
    coreIdentity: {
      name: '小张',
      age: 29,
      gender: '男',
      location: '广州',
      occupation: '健身教练'
    },
    look: {
      generalAppearance: '健硕阳光，运动风',
      hair: '短发，清爽',
      clothingAesthetic: '运动休闲，紧身衣',
      signatureDetails: '运动手环，健身包'
    },
    vibe: {
      traits: ['自律', '积极', '追求健康'],
      demeanor: '阳光自信',
      communicationStyle: '激励式，注重功能和健康'
    },
    context: {
      hobbies: '健身、跑步、营养学',
      values: '健康、自律、不断进步',
      frustrations: '不健康的产品、低效的工具',
      homeEnvironment: '小户型公寓，健身器材齐全'
    },
    targetCountries: ['CN', 'MY', 'SG', 'TH'],
    why: '健身人群对水杯等运动装备要求高，注重材质和功能'
  },

  // 7. 职场女性 - 全品类
  {
    name: '职场精英Amy',
    description: '28-35岁的职场女性，追求效率与精致',
    categories: ['3C', '家庭日用', '图书文具'],
    productNames: ['水杯', '电磁炉'],
    coreIdentity: {
      name: 'Amy',
      age: 32,
      gender: '女',
      location: '上海',
      occupation: '金融分析师'
    },
    look: {
      generalAppearance: '精致优雅，职业风',
      hair: '中长发，精致发型',
      clothingAesthetic: '职业装，简约高级',
      signatureDetails: '精致包包，配饰讲究'
    },
    vibe: {
      traits: ['精致', '高效', '追求品质'],
      demeanor: '优雅自信',
      communicationStyle: '简洁高效，注重品质和设计'
    },
    context: {
      hobbies: '瑜伽、下午茶、艺术展',
      values: '效率、品质、自我提升',
      frustrations: '低效、低质、不美观',
      homeEnvironment: '精装公寓，现代简约，注重品质'
    },
    targetCountries: ['CN', 'MY', 'SG'],
    why: '职场女性追求高品质、高效率的产品，愿意为品质付费'
  },

  // 8. 老年退休人士 - 简单易用
  {
    name: '退休老师王老师',
    description: '55-65岁的退休人士，追求简单易用',
    categories: ['家庭日用', '3C', '图书文具'],
    productNames: ['电磁炉', '水杯', '图书'],
    coreIdentity: {
      name: '王老师',
      age: 60,
      gender: '女',
      location: '南京',
      occupation: '退休教师'
    },
    look: {
      generalAppearance: '朴实大方，舒适为主',
      hair: '短发，花白',
      clothingAesthetic: '舒适休闲，保守稳重',
      signatureDetails: '老花镜，购物车'
    },
    vibe: {
      traits: ['稳重', '节俭', '关注健康'],
      demeanor: '和蔼可亲',
      communicationStyle: '详细咨询，需要耐心讲解'
    },
    context: {
      hobbies: '太极、园艺、读书',
      values: '健康、安全、简单易用',
      frustrations: '操作复杂、字太小、不安全',
      homeEnvironment: '老式小区，两居室，简朴实用'
    },
    targetCountries: ['CN', 'MY'],
    why: '老年人群需要简单易用、安全可靠的产品'
  },

  // 9. 小户型家庭 - 空间节省型
  {
    name: '小家庭刘先生',
    description: '30-40岁的小户型家庭，注重空间利用',
    categories: ['3C', '家庭日用'],
    productNames: ['电磁炉', '水杯'],
    coreIdentity: {
      name: '刘先生',
      age: 35,
      gender: '男',
      location: '杭州',
      occupation: 'IT工程师'
    },
    look: {
      generalAppearance: '普通职场人士，实用为主',
      hair: '短发，简单',
      clothingAesthetic: '商务休闲',
      signatureDetails: '双肩包，电脑'
    },
    vibe: {
      traits: ['理性', '务实', '追求性价比'],
      demeanor: '平和务实',
      communicationStyle: '理性分析，注重实用性'
    },
    context: {
      hobbies: '游戏、看书、居家',
      values: '空间利用、多功能、性价比',
      frustrations: '占地方、单一功能、价格虚高',
      homeEnvironment: '小户型两居室，注重空间利用'
    },
    targetCountries: ['CN', 'MY', 'SG'],
    why: '小户型家庭需要多功能、省空间的产品'
  },

  // 10. 追求生活美学的女生 - 颜值党
  {
    name: '生活博主小美',
    description: '22-28岁的生活方式博主，追求美感',
    categories: ['家庭日用', '3C', '图书文具'],
    productNames: ['水杯', '图书'],
    coreIdentity: {
      name: '小美',
      age: 26,
      gender: '女',
      location: '成都',
      occupation: '生活方式博主'
    },
    look: {
      generalAppearance: '精致时尚，ins风',
      hair: '长发，精心打理',
      clothingAesthetic: '时尚个性，色彩搭配',
      signatureDetails: '相机，时尚配饰'
    },
    vibe: {
      traits: ['追求美感', '热爱分享', '注重体验'],
      demeanor: '热情外向',
      communicationStyle: '感性表达，注重视觉和氛围'
    },
    context: {
      hobbies: '拍照、探店、社交媒体',
      values: '美感、仪式感、可分享性',
      frustrations: '不上镜、设计丑、不够精致',
      homeEnvironment: '精致小户型，ins风装修，适合拍照'
    },
    targetCountries: ['CN', 'MY', 'TH', 'SG'],
    why: '生活博主注重产品颜值和可分享性，是社交媒体传播的关键'
  },

  // 11. 马来西亚华人家庭 - 本地化
  {
    name: '马来西亚华人张太太',
    description: '35-45岁的马来西亚华人，关注实用性',
    categories: ['3C', '家庭日用'],
    productNames: ['电磁炉', '水杯'],
    coreIdentity: {
      name: '张太太',
      age: 38,
      gender: '女',
      location: '吉隆坡',
      occupation: '会计'
    },
    look: {
      generalAppearance: '朴实大方，东南亚风',
      hair: '中长发',
      clothingAesthetic: '休闲舒适',
      signatureDetails: '购物袋，太阳镜'
    },
    vibe: {
      traits: ['务实', '顾家', '注重性价比'],
      demeanor: '热情友善',
      communicationStyle: '详细对比，关注实用和价格'
    },
    context: {
      hobbies: '做饭、家庭聚会、逛街',
      values: '家庭、实用、物美价廉',
      frustrations: '不适合热带气候、价格贵、不耐用',
      homeEnvironment: '组屋，热带气候，注重通风'
    },
    targetCountries: ['MY'],
    why: '马来西亚华人是重要市场，需考虑本地气候和习惯'
  },

  // 12. 泰国年轻人 - 社交导向
  {
    name: '泰国大学生Ploy',
    description: '20-25岁的泰国年轻人，热爱社交',
    categories: ['家庭日用', '3C', '图书文具'],
    productNames: ['水杯'],
    coreIdentity: {
      name: 'Ploy',
      age: 22,
      gender: '女',
      location: '曼谷',
      occupation: '大学生'
    },
    look: {
      generalAppearance: '时尚活力，东南亚风',
      hair: '长发，染色',
      clothingAesthetic: '休闲时尚，色彩鲜艳',
      signatureDetails: '手机，耳机'
    },
    vibe: {
      traits: ['活泼', '社交', '追求潮流'],
      demeanor: '热情开朗',
      communicationStyle: '感性活泼，注重社交和分享'
    },
    context: {
      hobbies: '社交媒体、逛街、咖啡馆',
      values: '社交、潮流、分享',
      frustrations: '不够潮、不好拍照、朋友没有',
      homeEnvironment: '学生公寓，注重装饰和氛围'
    },
    targetCountries: ['TH', 'MY', 'VN'],
    why: '东南亚年轻人是社交媒体活跃用户，口碑传播力强'
  },

  // 13. 越南上班族 - 性价比优先
  {
    name: '越南职员Nguyen',
    description: '25-35岁的越南上班族，注重性价比',
    categories: ['3C', '家庭日用'],
    productNames: ['电磁炉', '水杯'],
    coreIdentity: {
      name: 'Nguyen',
      age: 28,
      gender: '男',
      location: '胡志明市',
      occupation: '销售'
    },
    look: {
      generalAppearance: '简洁干净，职场风',
      hair: '短发',
      clothingAesthetic: '商务休闲',
      signatureDetails: '摩托车头盔，公文包'
    },
    vibe: {
      traits: ['务实', '努力', '追求性价比'],
      demeanor: '友好进取',
      communicationStyle: '理性务实，注重价格和质量'
    },
    context: {
      hobbies: '足球、咖啡、朋友聚会',
      values: '性价比、质量、实用',
      frustrations: '价格贵、质量差、不耐用',
      homeEnvironment: '小户型公寓，简单实用'
    },
    targetCountries: ['VN', 'TH', 'MY'],
    why: '越南市场增长快，注重性价比和质量'
  },

  // 14. 新加坡职场人士 - 高端市场
  {
    name: '新加坡经理David',
    description: '30-40岁的新加坡职场人士，追求品质',
    categories: ['3C', '家庭日用', '图书文具'],
    productNames: ['电磁炉', '水杯', '图书'],
    coreIdentity: {
      name: 'David',
      age: 35,
      gender: '男',
      location: '新加坡',
      occupation: '银行经理'
    },
    look: {
      generalAppearance: '精英范，国际化',
      hair: '短发，精致',
      clothingAesthetic: '商务正装',
      signatureDetails: '名表，公文包'
    },
    vibe: {
      traits: ['高效', '追求品质', '国际化'],
      demeanor: '专业自信',
      communicationStyle: '简洁高效，注重品牌和品质'
    },
    context: {
      hobbies: '高尔夫、美食、旅行',
      values: '品质、效率、品牌',
      frustrations: '低质、低效、不够高端',
      homeEnvironment: 'HDB或私人公寓，现代精致'
    },
    targetCountries: ['SG', 'MY'],
    why: '新加坡是高端市场，消费者愿意为品质付费'
  },

  // 15. 厨房达人 - 烹饪爱好者
  {
    name: '美食博主小厨',
    description: '25-40岁的烹饪爱好者，追求专业',
    categories: ['3C', '家庭日用'],
    productNames: ['电磁炉'],
    coreIdentity: {
      name: '小厨',
      age: 32,
      gender: '女',
      location: '广州',
      occupation: '美食博主'
    },
    look: {
      generalAppearance: '温和亲切，居家风',
      hair: '中长发，简单扎起',
      clothingAesthetic: '居家舒适，偶尔围裙',
      signatureDetails: '相机，笔记本'
    },
    vibe: {
      traits: ['专业', '热爱烹饪', '注重细节'],
      demeanor: '温和耐心',
      communicationStyle: '专业详细，注重功能和效果'
    },
    context: {
      hobbies: '烹饪、美食摄影、分享食谱',
      values: '专业、效果、可分享性',
      frustrations: '功能单一、不够专业、效果差',
      homeEnvironment: '厨房设备齐全，注重烹饪体验'
    },
    targetCountries: ['CN', 'MY', 'TH', 'SG'],
    why: '烹饪爱好者是厨房电器的专业用户，注重功能和效果'
  },

  // 16. 极简主义者 - 少即是多
  {
    name: '极简主义者阿简',
    description: '28-38岁的极简主义者，追求简约',
    categories: ['家庭日用', '3C', '图书文具'],
    productNames: ['水杯', '图书'],
    coreIdentity: {
      name: '阿简',
      age: 33,
      gender: '男',
      location: '北京',
      occupation: '建筑师'
    },
    look: {
      generalAppearance: '简约利落，克制美学',
      hair: '短发，简洁',
      clothingAesthetic: '极简风，基础款',
      signatureDetails: '简约单肩包'
    },
    vibe: {
      traits: ['理性', '克制', '追求本质'],
      demeanor: '沉静内敛',
      communicationStyle: '简洁明了，注重本质和设计'
    },
    context: {
      hobbies: '读书、散步、冥想',
      values: '简约、质量、可持续',
      frustrations: '多余功能、过度包装、华而不实',
      homeEnvironment: '极简装修，物品精简，注重质感'
    },
    targetCountries: ['CN', 'SG', 'MY'],
    why: '极简主义者注重产品本质和设计，愿意为品质付费'
  },

  // 17. 环保主义者 - 可持续生活
  {
    name: '环保达人绿绿',
    description: '25-35岁的环保主义者，注重可持续',
    categories: ['家庭日用', '图书文具'],
    productNames: ['水杯', '图书'],
    coreIdentity: {
      name: '绿绿',
      age: 29,
      gender: '女',
      location: '深圳',
      occupation: 'NGO工作者'
    },
    look: {
      generalAppearance: '自然舒适，环保风',
      hair: '中长发，自然',
      clothingAesthetic: '环保材质，舒适自然',
      signatureDetails: '环保袋，可重复使用物品'
    },
    vibe: {
      traits: ['环保', '有责任感', '理想主义'],
      demeanor: '温和坚定',
      communicationStyle: '理念驱动，注重环保和可持续'
    },
    context: {
      hobbies: '环保活动、徒步、阅读',
      values: '环保、可持续、社会责任',
      frustrations: '一次性产品、过度包装、不环保材质',
      homeEnvironment: '环保装修，物品精简，可持续生活'
    },
    targetCountries: ['CN', 'SG', 'MY', 'TH'],
    why: '环保主义者是可持续产品的核心用户，注重材质和理念'
  },

  // 18. 单身宅男 - 便利至上
  {
    name: '宅男阿宅',
    description: '22-32岁的单身宅男，追求便利',
    categories: ['3C', '家庭日用'],
    productNames: ['电磁炉', '水杯'],
    coreIdentity: {
      name: '阿宅',
      age: 27,
      gender: '男',
      location: '成都',
      occupation: '程序员'
    },
    look: {
      generalAppearance: '休闲随意，舒适为主',
      hair: '中短发，随意',
      clothingAesthetic: 'T恤短裤，居家休闲',
      signatureDetails: '眼镜，耳机'
    },
    vibe: {
      traits: ['宅', '追求便利', '技术导向'],
      demeanor: '内向平和',
      communicationStyle: '理性技术，注重便利和功能'
    },
    context: {
      hobbies: '游戏、动漫、科技产品',
      values: '便利、功能、性价比',
      frustrations: '操作复杂、不够智能、麻烦',
      homeEnvironment: '小户型，电子设备多，简单实用'
    },
    targetCountries: ['CN', 'MY', 'SG'],
    why: '单身宅男注重便利和功能，是电子产品的重要用户'
  },

  // 19. 二胎家庭 - 家庭需求大
  {
    name: '二胎妈妈赵女士',
    description: '32-42岁的二胎家庭，注重效率',
    categories: ['家庭日用', '3C'],
    productNames: ['电磁炉', '水杯'],
    coreIdentity: {
      name: '赵女士',
      age: 36,
      gender: '女',
      location: '杭州',
      occupation: '兼职会计'
    },
    look: {
      generalAppearance: '朴实干练，妈妈风',
      hair: '短发，简单',
      clothingAesthetic: '休闲舒适，实用为主',
      signatureDetails: '妈咪包，婴儿用品'
    },
    vibe: {
      traits: ['高效', '顾家', '注重性价比'],
      demeanor: '干练务实',
      communicationStyle: '直接高效，注重实用性'
    },
    context: {
      hobbies: '育儿、家庭活动、母婴社群',
      values: '家庭、效率、性价比',
      frustrations: '浪费时间、不够安全、价格贵',
      homeEnvironment: '三居室以上，家庭成员多，注重实用'
    },
    targetCountries: ['CN', 'MY', 'TH'],
    why: '二胎家庭需求量大，注重高效和性价比'
  },

  // 20. 留学生 - 适应新环境
  {
    name: '留学生小留',
    description: '18-25岁的留学生，适应新环境',
    categories: ['家庭日用', '3C', '图书文具'],
    productNames: ['水杯', '电磁炉', '图书'],
    coreIdentity: {
      name: '小留',
      age: 21,
      gender: '女',
      location: '新加坡/马来西亚',
      occupation: '留学生'
    },
    look: {
      generalAppearance: '青春学生风，休闲',
      hair: '长发，简单',
      clothingAesthetic: '休闲舒适，学生风',
      signatureDetails: '背包，保温杯'
    },
    vibe: {
      traits: ['独立', '适应力强', '追求性价比'],
      demeanor: '开朗乐观',
      communicationStyle: '友好真诚，注重实用和价格'
    },
    context: {
      hobbies: '学习、社交、探索城市',
      values: '性价比、实用、便携',
      frustrations: '不便携、价格贵、不适应本地',
      homeEnvironment: '学生宿舍或合租，空间有限'
    },
    targetCountries: ['MY', 'SG', 'TH'],
    why: '留学生是重要用户群，注重性价比和便携性'
  }
]

async function main() {
  console.log('🚀 开始初始化人设数据...')

  // 1. 先查询现有商品
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      subcategory: true
    }
  })

  console.log(`📦 找到 ${products.length} 个商品`)
  console.log('商品列表:', products.map(p => `${p.name} (${p.category})`).join(', '))

  // 2. 创建人设
  let createdCount = 0
  let skippedCount = 0

  for (const template of personaTemplates) {
    try {
      // 查找匹配的商品
      const matchingProducts = products.filter(p => 
        template.categories.includes(p.category) ||
        (template.productNames && template.productNames.some(name => 
          p.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(p.name.toLowerCase())
        ))
      )

      if (matchingProducts.length === 0) {
        console.log(`⚠️  跳过人设 "${template.name}"：没有匹配的商品`)
        skippedCount++
        continue
      }

      // 使用第一个匹配的商品作为主商品
      const primaryProduct = matchingProducts[0]

      // 找到类目ID
      const category = await prisma.category.findFirst({
        where: {
          name: primaryProduct.category
        }
      })

      if (!category) {
        console.warn(`⚠️  跳过人设 "${template.name}"：找不到类目 "${primaryProduct.category}"`)
        skippedCount++
        continue
      }

      // 创建人设
      const persona = await prisma.persona.create({
        data: {
          name: template.name,
          description: template.description,
          productId: primaryProduct.id,
          categoryId: category.id,
          // 暂时不使用 productIds 和 categoryIds（数据库列还未创建）
          // productIds: matchingProducts.map(p => p.id),
          // categoryIds: [category.id],
          coreIdentity: template.coreIdentity,
          look: template.look,
          vibe: template.vibe,
          context: template.context,
          why: template.why,
          aiModel: 'manual', // 手动创建
          promptTemplate: 'manual-init',
          isActive: true,
          version: 1,
          generatedContent: {
            basicInfo: template.coreIdentity,
            appearance: template.look,
            personality: template.vibe,
            lifestyle: template.context,
            why: template.why,
            targetCountries: template.targetCountries,
            // 把多个关联商品信息保存在 generatedContent 中
            relatedProducts: matchingProducts.map(p => ({ id: p.id, name: p.name, category: p.category }))
          }
        }
      })

      console.log(`✅ 创建人设: ${template.name} (ID: ${persona.id})`)
      console.log(`   关联商品: ${matchingProducts.map(p => p.name).join(', ')}`)
      console.log(`   目标国家: ${template.targetCountries.join(', ')}`)
      createdCount++
    } catch (error) {
      console.error(`❌ 创建人设 "${template.name}" 失败:`, error)
    }
  }

  console.log('\n📊 初始化完成！')
  console.log(`✅ 成功创建: ${createdCount} 个人设`)
  console.log(`⚠️  跳过: ${skippedCount} 个人设`)

  // 3. 统计信息
  const totalPersonas = await prisma.persona.count()
  const personasByCategory = await prisma.persona.groupBy({
    by: ['categoryId'],
    _count: true
  })

  console.log(`\n📈 数据库人设总数: ${totalPersonas}`)
  console.log('各类目人设数量:')
  for (const item of personasByCategory) {
    console.log(`  - ${item.categoryId}: ${item._count} 个`)
  }
}

main()
  .catch((e) => {
    console.error('❌ 脚本执行失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

