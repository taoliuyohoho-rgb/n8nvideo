-- 添加多选字段到 Persona 表
-- 手动迁移SQL（如果自动迁移失败）

-- 添加 categoryIds 字段（数组）
ALTER TABLE "personas" ADD COLUMN IF NOT EXISTS "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 添加 productIds 字段（数组）
ALTER TABLE "personas" ADD COLUMN IF NOT EXISTS "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 将现有单选数据迁移到多选字段
UPDATE "personas" 
SET "categoryIds" = ARRAY["categoryId"]
WHERE "categoryId" IS NOT NULL AND "categoryId" != '' AND array_length("categoryIds", 1) IS NULL;

UPDATE "personas"
SET "productIds" = ARRAY["productId"]
WHERE "productId" IS NOT NULL AND "productId" != '' AND array_length("productIds", 1) IS NULL;

-- 验证迁移结果
SELECT id, name, "categoryId", "categoryIds", "productId", "productIds" FROM "personas" LIMIT 5;

