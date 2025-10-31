import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


/**
 * PUT /api/admin/personas/[id] - 更新人设
 * 支持新旧两种数据结构
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    console.log('📝 更新人设请求:', { id, body: Object.keys(body) })

    // 判断使用新格式还是旧格式
    const isNewFormat = body.generatedContent || body.name || body.categoryId
    
           if (isNewFormat) {
             // 新格式：支持完整的人设数据更新（含多选）
             const { 
               name, 
               description, 
               // 多选字段
               categoryIds,
               productIds,
               // 单选字段（向后兼容）
               categoryId, 
               productId, 
               textDescription,
               generatedContent,
               aiModel,
               promptTemplate,
               generationParams
             } = body

             // 处理多选数据（兼容旧格式）
             const finalCategoryIds = categoryIds && categoryIds.length > 0 
               ? categoryIds 
               : (categoryId ? [categoryId] : [])
             
             const finalProductIds = productIds && productIds.length > 0
               ? productIds
               : (productId ? [productId] : [])

             // 校验必需字段
             if (!name || finalCategoryIds.length === 0) {
               return NextResponse.json(
                 { success: false, error: '缺少必需字段：name 和至少一个类目' },
                 { status: 400 }
               )
             }

             // 验证所有类目是否存在
             for (const catId of finalCategoryIds) {
               const category = await prisma.category.findUnique({
                 where: { id: catId }
               })

               if (!category) {
                 return NextResponse.json(
                   { success: false, error: `类目不存在: ${catId}` },
                   { status: 404 }
                 )
               }
             }

             // 验证所有商品是否存在
             for (const prodId of finalProductIds) {
               const product = await prisma.product.findUnique({
                 where: { id: prodId }
               })

               if (!product) {
                 return NextResponse.json(
                   { success: false, error: `商品不存在: ${prodId}` },
                   { status: 404 }
                 )
               }
             }

            console.log('✅ 使用新格式更新人设（多选）:', { 
              name, 
              categoryIds: finalCategoryIds, 
              productIds: finalProductIds 
            })

            // 先获取现有人设数据
            const existingPersona = await prisma.persona.findUnique({ where: { id } })
            if (!existingPersona) {
              return NextResponse.json(
                { success: false, error: '人设不存在' },
                { status: 404 }
              )
            }

            console.log('📦 现有人设数据字段:', Object.keys(existingPersona))
            console.log('📝 前端提交的字段:', Object.keys(body))

            // 更新人设（支持多对多关系）
            // 保留未提交的字段，只更新前端提供的字段
            const persona = await prisma.persona.update({
              where: { id },
              data: {
                // 基础字段：使用提交值或保留原值
                name: name !== undefined ? name : existingPersona.name,
                description: description !== undefined ? description : existingPersona.description,
                // 主类目和主商品
                categoryId: finalCategoryIds.length > 0 ? finalCategoryIds[0] : existingPersona.categoryId,
                productId: finalProductIds.length > 0 ? finalProductIds[0] : existingPersona.productId,
                // 可选字段：提交了就更新，否则保留原值
                textDescription: textDescription !== undefined ? textDescription : existingPersona.textDescription,
                generatedContent: generatedContent !== undefined ? generatedContent : existingPersona.generatedContent,
                aiModel: aiModel !== undefined ? aiModel : existingPersona.aiModel,
                promptTemplate: promptTemplate !== undefined ? promptTemplate : existingPersona.promptTemplate,
                generationParams: generationParams !== undefined ? generationParams : existingPersona.generationParams,
                // 旧格式字段：保留原值（不应该被覆盖）
                coreIdentity: existingPersona.coreIdentity as any,
                look: existingPersona.look as any,
                vibe: existingPersona.vibe as any,
                context: existingPersona.context as any,
                why: existingPersona.why,
                modelUsed: existingPersona.modelUsed as any,
                version: existingPersona.version,
                createdBy: existingPersona.createdBy,
                isActive: existingPersona.isActive,
                updatedAt: new Date(),
                // 多对多关系：先删除旧关系，再创建新关系
                personaCategories: {
                  deleteMany: {}, // 删除所有旧类目关系
                  create: finalCategoryIds.map((catId: string, index: number) => ({
                    categoryId: catId,
                    isPrimary: index === 0
                  }))
                },
                personaProducts: {
                  deleteMany: {}, // 删除所有旧商品关系
                  create: finalProductIds.length > 0 ? finalProductIds.map((prodId: string, index: number) => ({
                    productId: prodId,
                    isPrimary: index === 0
                  })) : []
                }
              },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    categoryId: true
                  }
                },
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                personaCategories: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                },
                personaProducts: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            })

            console.log('✅ 人设更新成功:', persona.id, '关联类目:', finalCategoryIds.length, '关联商品:', finalProductIds.length)

             return NextResponse.json({
               success: true,
               data: persona,
               message: '人设更新成功'
             })
           } else {
      // 旧格式：保持向后兼容
      const { productId, coreIdentity, look, vibe, context, why, modelUsed } = body

      // 校验必需字段
      if (!coreIdentity || !look || !vibe || !context || !why) {
        return NextResponse.json(
          { success: false, error: '缺少必需字段' },
          { status: 400 }
        )
      }

      // 如果更新了productId，验证商品存在
      if (productId) {
        const product = await prisma.product.findUnique({
          where: { id: productId }
        })

        if (!product) {
          return NextResponse.json(
            { success: false, error: '商品不存在' },
            { status: 404 }
          )
        }
      }

      console.log('⚠️  使用旧格式更新人设（建议迁移到新格式）')

      // 更新人设（旧格式）
      const persona = await prisma.persona.update({
        where: { id },
        data: {
          ...(productId && { productId }),
          coreIdentity,
          look,
          vibe,
          context,
          why,
          modelUsed: modelUsed || null
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: persona
      })
    }
  } catch (error) {
    console.error('❌ 更新人设失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新人设失败'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/personas/[id] - 删除人设
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.persona.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('删除人设失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除人设失败'
      },
      { status: 500 }
    )
  }
}

