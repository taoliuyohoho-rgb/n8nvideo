#!/usr/bin/env node

/**
 * 诊断脚本多样性问题
 * 连续生成2次脚本，对比差异
 */

const fetch = require('node-fetch');

async function generateScript(productId, personaId) {
  const response = await fetch('http://localhost:3000/api/script/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      personaId,
      durationSec: 15
    })
  });

  const data = await response.json();
  return data;
}

async function main() {
  console.log('🔍 开始诊断脚本多样性问题...\n');

  // 替换为你测试用的商品ID和人设ID
  const productId = process.argv[2];
  const personaId = process.argv[3];

  if (!productId || !personaId) {
    console.error('❌ 请提供商品ID和人设ID');
    console.log('用法: node scripts/diagnose-script-diversity.js <productId> <personaId>');
    console.log('\n💡 如何获取ID：');
    console.log('1. 在浏览器控制台，选择商品后执行: console.log(product.id)');
    console.log('2. 选择人设后执行: console.log(persona.id)');
    process.exit(1);
  }

  console.log(`📦 商品ID: ${productId}`);
  console.log(`👤 人设ID: ${personaId}\n`);

  // 第一次生成
  console.log('🎬 第1次生成脚本...');
  const result1 = await generateScript(productId, personaId);
  
  if (!result1.success) {
    console.error('❌ 第1次生成失败:', result1.error);
    process.exit(1);
  }

  const script1 = result1.scripts[0];
  console.log('✅ 第1次生成完成');
  console.log('   - angle:', script1.angle);
  console.log('   - shots数量:', script1.shots?.length || 0);
  console.log('   - 第1个shot:', script1.shots?.[0]?.action || 'N/A');
  console.log('   - warnings:', result1.warnings || 'none');
  console.log('   - modelUsed:', result1.modelUsed?.provider || 'unknown');
  console.log('');

  // 等待1秒
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 第二次生成
  console.log('🎬 第2次生成脚本...');
  const result2 = await generateScript(productId, personaId);
  
  if (!result2.success) {
    console.error('❌ 第2次生成失败:', result2.error);
    process.exit(1);
  }

  const script2 = result2.scripts[0];
  console.log('✅ 第2次生成完成');
  console.log('   - angle:', script2.angle);
  console.log('   - shots数量:', script2.shots?.length || 0);
  console.log('   - 第1个shot:', script2.shots?.[0]?.action || 'N/A');
  console.log('   - warnings:', result2.warnings || 'none');
  console.log('   - modelUsed:', result2.modelUsed?.provider || 'unknown');
  console.log('');

  // 对比分析
  console.log('========================================');
  console.log('📊 对比分析');
  console.log('========================================\n');

  // 1. 对比 angle
  console.log('1️⃣ 脚本角度 (angle):');
  if (script1.angle === script2.angle) {
    console.log('   ⚠️ 完全相同:', script1.angle);
  } else {
    console.log('   ✅ 不同');
    console.log('   - 第1次:', script1.angle);
    console.log('   - 第2次:', script2.angle);
  }
  console.log('');

  // 2. 对比 lines
  console.log('2️⃣ 台词内容 (lines):');
  if (script1.lines?.open === script2.lines?.open) {
    console.log('   ⚠️ 开场白完全相同:', script1.lines?.open);
  } else {
    console.log('   ✅ 开场白不同');
    console.log('   - 第1次:', script1.lines?.open);
    console.log('   - 第2次:', script2.lines?.open);
  }
  console.log('');

  // 3. 对比 shots
  console.log('3️⃣ 镜头分解 (shots):');
  if (!script1.shots || !script2.shots) {
    console.log('   ❌ 其中一个脚本没有shots');
  } else {
    // 对比每个shot
    const allSame = script1.shots.every((shot1, i) => {
      const shot2 = script2.shots[i];
      return shot1?.second === shot2?.second &&
             shot1?.camera === shot2?.camera &&
             shot1?.action === shot2?.action;
    });

    if (allSame) {
      console.log('   ❌ 所有镜头完全相同！');
      console.log('\n   详细对比:');
      script1.shots.forEach((shot, i) => {
        console.log(`   镜头${i + 1}:`);
        console.log(`     时间: ${shot.second}s`);
        console.log(`     机位: ${shot.camera}`);
        console.log(`     动作: ${shot.action}`);
      });
    } else {
      console.log('   ✅ 镜头有差异');
      console.log('\n   详细对比:');
      script1.shots.forEach((shot1, i) => {
        const shot2 = script2.shots[i];
        console.log(`   镜头${i + 1}:`);
        if (shot1.action === shot2.action) {
          console.log(`     ⚠️ 动作相同: ${shot1.action}`);
        } else {
          console.log(`     ✅ 动作不同:`);
          console.log(`       第1次: ${shot1.action}`);
          console.log(`       第2次: ${shot2.action}`);
        }
      });
    }
  }
  console.log('');

  // 4. 对比模型使用
  console.log('4️⃣ AI模型:');
  const model1 = result1.modelUsed;
  const model2 = result2.modelUsed;
  if (model1?.provider === model2?.provider && model1?.model === model2?.model) {
    console.log('   ⚠️ 使用了相同的模型:', `${model1?.provider}/${model1?.model}`);
  } else {
    console.log('   ✅ 使用了不同的模型');
    console.log('   - 第1次:', `${model1?.provider}/${model1?.model}`);
    console.log('   - 第2次:', `${model2?.provider}/${model2?.model}`);
  }
  console.log('');

  // 5. 完整JSON对比
  console.log('5️⃣ 完整JSON对比:');
  const json1 = JSON.stringify(script1.shots, null, 2);
  const json2 = JSON.stringify(script2.shots, null, 2);
  
  if (json1 === json2) {
    console.log('   ❌ 两次生成的shots JSON完全一致！');
    console.log('\n   这说明问题是：');
    console.log('   1. AI输入参数完全相同（商品、人设、Prompt）');
    console.log('   2. 随机种子没有起作用');
    console.log('   3. AI模型对相同输入返回相同输出（温度参数为0？）');
  } else {
    console.log('   ✅ shots JSON有差异');
  }
  console.log('');

  // 诊断建议
  console.log('========================================');
  console.log('🎯 诊断建议');
  console.log('========================================\n');

  if (json1 === json2) {
    console.log('❌ 确认：两次生成完全一样！\n');
    console.log('可能原因：');
    console.log('1. ⚠️ 推荐系统缓存：推荐引擎可能缓存了决策');
    console.log('   → 检查 decisionCache 是否缓存了相同输入的结果');
    console.log('');
    console.log('2. ⚠️ AI模型temperature=0：模型参数设置为确定性输出');
    console.log('   → 检查 callModel 的 temperature 参数');
    console.log('');
    console.log('3. ⚠️ 随机种子未传递：randomSeed 没有真正发送给AI');
    console.log('   → 检查 promptWithSeed 是否包含在实际请求中');
    console.log('');
    console.log('4. ⚠️ 输入信息太固定：商品卖点、人设每次都一样');
    console.log('   → 虽然加了随机选择，但可能数据源就很少');
    console.log('');
  } else {
    console.log('✅ 两次生成有差异，说明随机性正常工作！');
  }

  console.log('========================================\n');
}

main().catch(console.error);

