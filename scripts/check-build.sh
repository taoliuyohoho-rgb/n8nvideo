#!/bin/bash
# 检查构建状态

BUILD_ID=$1
PROJECT_ID="ecommerce-475403"

if [ -z "$BUILD_ID" ]; then
  echo "获取最新的构建任务..."
  BUILD_ID=$(gcloud builds list --project=${PROJECT_ID} --limit=1 --format="value(id)" 2>/dev/null)
fi

if [ -z "$BUILD_ID" ]; then
  echo "❌ 没有找到构建任务"
  exit 1
fi

echo "检查构建: ${BUILD_ID}"
echo ""

STATUS=$(gcloud builds describe ${BUILD_ID} --project=${PROJECT_ID} --format="value(status)" 2>/dev/null)
echo "状态: ${STATUS}"

if [ "$STATUS" = "WORKING" ] || [ "$STATUS" = "QUEUED" ]; then
  echo "⏳ 构建进行中，查看实时日志："
  echo "https://console.cloud.google.com/cloud-build/builds/${BUILD_ID}?project=${PROJECT_ID}"
  echo ""
  echo "最新日志："
  gcloud builds log ${BUILD_ID} --project=${PROJECT_ID} 2>&1 | tail -20
elif [ "$STATUS" = "SUCCESS" ]; then
  echo "✅ 构建成功！"
elif [ "$STATUS" = "FAILURE" ]; then
  echo "❌ 构建失败，查看错误："
  gcloud builds log ${BUILD_ID} --project=${PROJECT_ID} 2>&1 | grep -A 10 -E "(error|Error|ERROR|FAILED)" | tail -30
fi

