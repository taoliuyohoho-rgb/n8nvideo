import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 模拟数据初始化
    const mockData = {
      products: [
        { name: '电磁炉', category: '3C', price: 'RM79.00' },
        { name: '手持风扇', category: '3C', price: 'RM39.90' },
        { name: '电炖锅', category: '3C', price: 'RM143.00' },
        { name: '牛油果按摩膏', category: '美妆', price: 'RM19.90' },
        { name: 'XXXL按摩膏', category: '美妆', price: 'RM19.90' },
        { name: 'cosrx蜗牛血清精华原液', category: '美妆', price: 'RM17.90' },
        { name: 'cosrx珂丝艾丝氨基酸洗面奶', category: '美妆', price: 'RM12.99' },
        { name: 'cosrx芦荟隔离防晒霜', category: '美妆', price: 'RM15.80' },
        { name: '生发剂', category: '美妆', price: 'RM25.00' },
        { name: '祛斑', category: '美妆', price: 'RM18.99' },
        { name: '玻璃盖大肚锅', category: '3C', price: 'RM53.99' },
        { name: '电热水壶', category: '3C', price: 'RM62.00' },
        { name: '折叠锅', category: '3C', price: 'RM110.00' },
        { name: '妇炎洁草本私处湿巾', category: '美妆', price: 'RM14.50' },
        { name: '妇炎洁草本私处洗液', category: '美妆', price: 'RM11.66' }
      ],
      stats: {
        totalVideos: 6,
        totalProducts: 15,
        totalUsers: 1,
        usageDays: 1,
        efficiency: 100,
        efficiencyNote: '制作效率 = 成功生成视频数 / 总生成视频数 × 100%'
      }
    }

    return NextResponse.json({
      success: true,
      message: '数据初始化成功（模拟）',
      data: mockData
    })

  } catch (error) {
    console.error('数据初始化失败:', error)
    return NextResponse.json(
      { success: false, error: '数据初始化失败' },
      { status: 500 }
    )
  }
}
