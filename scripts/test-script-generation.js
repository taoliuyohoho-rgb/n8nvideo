#!/usr/bin/env node
/**
 * 测试脚本生成流程
 * 用于诊断为什么生成的脚本完全一样
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testScriptGeneration() {
  console.log('🧪 开始测试脚本生成流程...\n');

  // 测试数据
  const testData = {
    productId: 'test-product-001',
    personaId: 'test-persona-001',
    variants: 1
  };

  console.log('📋 测试参数:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    // 第一次生成
    console.log('🎬 第1次生成脚本...');
    const response1 = await fetch(`${BASE_URL}/api/script/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result1 = await response1.json();
    console.log('✅ 第1次响应状态:', response1.status);
    
    if (result1.warnings) {
      console.log('⚠️⚠️⚠️ 发现警告信息 ⚠️⚠️⚠️');
      result1.warnings.forEach(w => console.log('  ', w));
      console.log('');
    }

    if (!result1.success) {
      console.error('❌ 第1次生成失败:', result1.error);
      return;
    }

    const script1 = result1.scripts[0];
    console.log('📝 第1次脚本内容:');
    console.log('  角度:', script1.angle);
    console.log('  开场:', script1.lines?.open);
    console.log('  主体:', script1.lines?.main);
    console.log('  结尾:', script1.lines?.close);
    console.log('  镜头数量:', script1.shots?.length);
    if (script1.shots && script1.shots.length > 0) {
      console.log('  第1个镜头:', JSON.stringify(script1.shots[0]));
    }
    console.log('\n' + '='.repeat(80) + '\n');

    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第二次生成
    console.log('🎬 第2次生成脚本...');
    const response2 = await fetch(`${BASE_URL}/api/script/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result2 = await response2.json();
    console.log('✅ 第2次响应状态:', response2.status);
    
    if (result2.warnings) {
      console.log('⚠️⚠️⚠️ 发现警告信息 ⚠️⚠️⚠️');
      result2.warnings.forEach(w => console.log('  ', w));
      console.log('');
    }

    if (!result2.success) {
      console.error('❌ 第2次生成失败:', result2.error);
      return;
    }

    const script2 = result2.scripts[0];
    console.log('📝 第2次脚本内容:');
    console.log('  角度:', script2.angle);
    console.log('  开场:', script2.lines?.open);
    console.log('  主体:', script2.lines?.main);
    console.log('  结尾:', script2.lines?.close);
    console.log('  镜头数量:', script2.shots?.length);
    if (script2.shots && script2.shots.length > 0) {
      console.log('  第1个镜头:', JSON.stringify(script2.shots[0]));
    }
    console.log('\n' + '='.repeat(80) + '\n');

    // 对比
    console.log('🔍 对比结果:\n');
    
    const isSameAngle = script1.angle === script2.angle;
    const isSameOpen = script1.lines?.open === script2.lines?.open;
    const isSameMain = script1.lines?.main === script2.lines?.main;
    const isSameClose = script1.lines?.close === script2.lines?.close;
    const isSameShots = JSON.stringify(script1.shots) === JSON.stringify(script2.shots);

    console.log('  角度相同:', isSameAngle ? '✅ 是' : '❌ 否');
    console.log('  开场相同:', isSameOpen ? '✅ 是' : '❌ 否');
    console.log('  主体相同:', isSameMain ? '✅ 是' : '❌ 否');
    console.log('  结尾相同:', isSameClose ? '✅ 是' : '❌ 否');
    console.log('  镜头相同:', isSameShots ? '✅ 是' : '❌ 否');

    const completelyIdentical = isSameAngle && isSameOpen && isSameMain && isSameClose && isSameShots;
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    if (completelyIdentical) {
      console.log('❌❌❌ 两次生成的脚本完全相同！这不正常！\n');
      
      if (result1.warnings || result2.warnings) {
        console.log('🔍 诊断：触发了兜底逻辑，AI输出有问题');
      } else {
        console.log('🔍 诊断：AI输出确定性太强，或者有缓存问题');
      }
      
      console.log('\n建议排查：');
      console.log('1. 检查AI服务的temperature设置');
      console.log('2. 检查是否有缓存机制');
      console.log('3. 查看服务端日志中的AI原始输出');
      console.log('4. 确认prompt是否每次都完全相同');
    } else {
      console.log('✅ 两次生成的脚本有差异，这是正常的');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️ 无法连接到服务器，请确保开发服务器正在运行 (npm run dev)');
    }
  }
}

// 运行测试
testScriptGeneration();

