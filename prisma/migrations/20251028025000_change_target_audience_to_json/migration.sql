-- AlterTable
ALTER TABLE "products" ALTER COLUMN "targetAudience" TYPE JSON USING "targetAudience"::json;
