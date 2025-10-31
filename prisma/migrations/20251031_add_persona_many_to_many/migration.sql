-- CreateTable
CREATE TABLE "persona_products" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persona_categories" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "persona_products_personaId_idx" ON "persona_products"("personaId");

-- CreateIndex
CREATE INDEX "persona_products_productId_idx" ON "persona_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "persona_products_personaId_productId_key" ON "persona_products"("personaId", "productId");

-- CreateIndex
CREATE INDEX "persona_categories_personaId_idx" ON "persona_categories"("personaId");

-- CreateIndex
CREATE INDEX "persona_categories_categoryId_idx" ON "persona_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "persona_categories_personaId_categoryId_key" ON "persona_categories"("personaId", "categoryId");

-- AddForeignKey
ALTER TABLE "persona_products" ADD CONSTRAINT "persona_products_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_products" ADD CONSTRAINT "persona_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_categories" ADD CONSTRAINT "persona_categories_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_categories" ADD CONSTRAINT "persona_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

