#!/usr/bin/env node

/**
 * 测试视频生成流程
 * 验证从商品输入到视频生成的完整流程
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testVideoGenerationFlow() {
  console.log('🧪 开始测试视频生成流程...\n')

  try {
    // 步骤 1: 初始化商品
    console.log('步骤 1: 初始化商品...')
    const initResponse = await fetch(`${BASE_URL}/api/video-gen/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: 'iPhone 15 Pro' })
    })

    if (!initResponse.ok) {
      throw new Error(`初始化失败: ${initResponse.statusText}`)
    }

    const initData = await initResponse.json()
    console.log('✅ 商品初始化成功')
    console.log(`  商品ID: ${initData.product.id}`)
    console.log(`  Top5卖点: ${initData.top5.sellingPoints.length}个`)
    console.log(`  Top5痛点: ${initData.top5.painPoints.length}个`)

    const productId = initData.product.id

    // 步骤 2: 生成人设
    console.log('\n步骤 2: 生成人设...')
    const personaResponse = await fetch(`${BASE_URL}/api/persona/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    })

    if (!personaResponse.ok) {
      throw new Error(`人设生成失败: ${personaResponse.statusText}`)
    }

    const personaData = await personaResponse.json()
    console.log('✅ 人设生成成功')
    console.log(`  人设姓名: ${personaData.persona.coreIdentity.name}`)
    console.log(`  年龄: ${personaData.persona.coreIdentity.age}岁`)
    console.log(`  职业: ${personaData.persona.coreIdentity.occupation}`)

    // 步骤 3: 确认人设
    console.log('\n步骤 3: 确认人设...')
    const confirmPersonaResponse = await fetch(`${BASE_URL}/api/persona/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        persona: personaData.persona
      })
    })

    if (!confirmPersonaResponse.ok) {
      throw new Error(`人设确认失败: ${confirmPersonaResponse.statusText}`)
    }

    const confirmPersonaData = await confirmPersonaResponse.json()
    console.log('✅ 人设确认成功')
    console.log(`  人设ID: ${confirmPersonaData.personaId}`)

    const personaId = confirmPersonaData.personaId

    // 步骤 4: 生成脚本
    console.log('\n步骤 4: 生成脚本...')
    const scriptResponse = await fetch(`${BASE_URL}/api/script/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        personaId,
        variants: 1
      })
    })

    if (!scriptResponse.ok) {
      throw new Error(`脚本生成失败: ${scriptResponse.statusText}`)
    }

    const scriptData = await scriptResponse.json()
    console.log('✅ 脚本生成成功')
    console.log(`  脚本角度: ${scriptData.scripts[0].angle}`)
    console.log(`  时长: ${scriptData.scripts[0].durationSec}秒`)
    console.log(`  开场: ${scriptData.scripts[0].lines.open}`)

    // 步骤 5: 确认脚本
    console.log('\n步骤 5: 确认脚本...')
    const confirmScriptResponse = await fetch(`${BASE_URL}/api/script/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        personaId,
        scripts: scriptData.scripts
      })
    })

    if (!confirmScriptResponse.ok) {
      throw new Error(`脚本确认失败: ${confirmScriptResponse.statusText}`)
    }

    const confirmScriptData = await confirmScriptResponse.json()
    console.log('✅ 脚本确认成功')
    console.log(`  脚本ID: ${confirmScriptData.scriptIds[0]}`)

    const scriptId = confirmScriptData.scriptIds[0]

    // 步骤 6: 创建视频任务
    console.log('\n步骤 6: 创建视频任务...')
    const videoJobResponse = await fetch(`${BASE_URL}/api/video/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scriptId,
        providerPref: ['OpenAI', 'Pika'],
        seconds: 15,
        size: '720x1280'
      })
    })

    if (!videoJobResponse.ok) {
      throw new Error(`视频任务创建失败: ${videoJobResponse.statusText}`)
    }

    const videoJobData = await videoJobResponse.json()
    console.log('✅ 视频任务创建成功')
    console.log(`  任务ID: ${videoJobData.jobId}`)
    console.log(`  状态: ${videoJobData.status}`)

    // 步骤 7: 查询任务状态
    console.log('\n步骤 7: 查询任务状态...')
    const statusResponse = await fetch(`${BASE_URL}/api/video/jobs/${videoJobData.jobId}`)

    if (!statusResponse.ok) {
      throw new Error(`任务状态查询失败: ${statusResponse.statusText}`)
    }

    const statusData = await statusResponse.json()
    console.log('✅ 任务状态查询成功')
    console.log(`  状态: ${statusData.job.status}`)
    console.log(`  进度: ${statusData.job.progress}%`)

    console.log('\n🎉 视频生成流程测试完成！')
    console.log('\n📊 测试总结:')
    console.log(`  ✅ 商品初始化: 成功`)
    console.log(`  ✅ 人设生成: 成功`)
    console.log(`  ✅ 人设确认: 成功`)
    console.log(`  ✅ 脚本生成: 成功`)
    console.log(`  ✅ 脚本确认: 成功`)
    console.log(`  ✅ 视频任务创建: 成功`)
    console.log(`  ✅ 任务状态查询: 成功`)

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`)
    if (!response.ok) {
      throw new Error('服务器未运行')
    }
    return true
  } catch (error) {
    console.error('❌ 服务器未运行，请先启动开发服务器:')
    console.error('   npm run dev')
    return false
  }
}

async function main() {
  const serverRunning = await checkServer()
  if (!serverRunning) {
    process.exit(1)
  }

  await testVideoGenerationFlow()
}

main().catch((error) => {
  console.error('❌ 测试失败:', error)
  process.exit(1)
})
