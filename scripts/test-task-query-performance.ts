/**
 * 测试任务查询性能
 * 用于验证优化后的查询性能提升
 */

import { taskService } from '../src/services/task/TaskService'

async function testQueryPerformance() {
  console.log('🧪 开始测试任务查询性能...\n')

  // 测试 1: 查询所有任务
  console.log('📊 测试 1: 查询所有任务（无过滤）')
  const start1 = Date.now()
  const allTasks = await taskService.queryTasks({ limit: 100 })
  const time1 = Date.now() - start1
  console.log(`   结果: 查询到 ${allTasks.length} 条记录`)
  console.log(`   耗时: ${time1}ms`)
  console.log(`   平均每条: ${(time1 / allTasks.length).toFixed(2)}ms\n`)

  // 测试 2: 按状态过滤
  console.log('📊 测试 2: 按状态过滤（status=pending）')
  const start2 = Date.now()
  const pendingTasks = await taskService.queryTasks({ status: 'pending', limit: 100 })
  const time2 = Date.now() - start2
  console.log(`   结果: 查询到 ${pendingTasks.length} 条记录`)
  console.log(`   耗时: ${time2}ms\n`)

  // 测试 3: 按类型过滤
  console.log('📊 测试 3: 按类型过滤（type=video_generation）')
  const start3 = Date.now()
  const videoTasks = await taskService.queryTasks({ type: 'video_generation', limit: 100 })
  const time3 = Date.now() - start3
  console.log(`   结果: 查询到 ${videoTasks.length} 条记录`)
  console.log(`   耗时: ${time3}ms\n`)

  // 测试 4: 组合过滤
  console.log('📊 测试 4: 组合过滤（status=pending + type=video_generation）')
  const start4 = Date.now()
  const combinedTasks = await taskService.queryTasks({ 
    status: 'pending', 
    type: 'video_generation',
    limit: 100 
  })
  const time4 = Date.now() - start4
  console.log(`   结果: 查询到 ${combinedTasks.length} 条记录`)
  console.log(`   耗时: ${time4}ms\n`)

  // 测试 5: 查询单个任务详情
  if (allTasks.length > 0) {
    console.log('📊 测试 5: 查询单个任务详情（包含完整 payload/result）')
    const start5 = Date.now()
    const taskDetail = await taskService.getTask(allTasks[0].id)
    const time5 = Date.now() - start5
    console.log(`   结果: 任务 ${taskDetail?.id}`)
    console.log(`   耗时: ${time5}ms`)
    console.log(`   包含 payload: ${!!taskDetail?.payload}`)
    console.log(`   包含 result: ${!!taskDetail?.result}\n`)
  }

  // 总结
  console.log('✅ 性能测试完成！')
  console.log('\n💡 性能提示：')
  console.log('   - 列表查询应该在 100-500ms 内完成（取决于数据量和服务器性能）')
  console.log('   - 详情查询可能稍慢（因为包含完整 JSON 字段）')
  console.log('   - 如果查询时间超过 1 秒，请检查数据库索引是否正确创建')
}

testQueryPerformance()
  .then(() => {
    console.log('\n✅ 测试完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 测试失败:', error)
    process.exit(1)
  })

