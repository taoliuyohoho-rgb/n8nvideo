/**
 * 同步实体特征
 * 从 products/styles 表同步特征到 entity_features 表
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncProductFeatures(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) return;

  // Get or create entity index
  let entityIndex = await prisma.entityIndex.findUnique({
    where: {
      entityType_nativeId: {
        entityType: 'product',
        nativeId: productId,
      },
    },
  });

  if (!entityIndex) {
    entityIndex = await prisma.entityIndex.create({
      data: {
        entityType: 'product',
        nativeTable: 'products',
        nativeId: productId,
        status: 'active',
      },
    });
  }

  // Build minimal features
  const minimal = {
    category: product.category,
    lang: 'en', // Default, can improve
    priceTier: 'mid',
    styleTags: [],
  };

  // Build full features
  const full = {
    ...minimal,
    subcategory: product.subcategory,
    sellingPoints: product.sellingPoints ? JSON.parse(product.sellingPoints) : [],
    targetCountries: product.targetCountries ? JSON.parse(product.targetCountries) : [],
  };

  // Save features
  await prisma.entityFeature.create({
    data: {
      entityIndexId: entityIndex.id,
      featureGroup: 'ranking_minimal',
      features: JSON.stringify(minimal),
      featuresVersion: 'v1',
    },
  });

  await prisma.entityFeature.create({
    data: {
      entityIndexId: entityIndex.id,
      featureGroup: 'ranking_full',
      features: JSON.stringify(full),
      featuresVersion: 'v1',
    },
  });
}

async function syncStyleFeatures(styleId) {
  const style = await prisma.style.findUnique({
    where: { id: styleId },
  });

  if (!style) return;

  // Get or create entity index
  let entityIndex = await prisma.entityIndex.findUnique({
    where: {
      entityType_nativeId: {
        entityType: 'style',
        nativeId: styleId,
      },
    },
  });

  if (!entityIndex) {
    entityIndex = await prisma.entityIndex.create({
      data: {
        entityType: 'style',
        nativeTable: 'styles',
        nativeId: styleId,
        status: 'active',
      },
    });
  }

  // Build minimal features
  const minimal = {
    tone: style.tone,
    supportedLanguages: [],
    platformFit: [],
  };

  // Build full features
  const full = {
    ...minimal,
    category: style.category,
    subcategory: style.subcategory,
    scriptStructure: style.scriptStructure ? JSON.parse(style.scriptStructure) : {},
  };

  // Save features
  await prisma.entityFeature.create({
    data: {
      entityIndexId: entityIndex.id,
      featureGroup: 'ranking_minimal',
      features: JSON.stringify(minimal),
      featuresVersion: 'v1',
    },
  });

  await prisma.entityFeature.create({
    data: {
      entityIndexId: entityIndex.id,
      featureGroup: 'ranking_full',
      features: JSON.stringify(full),
      featuresVersion: 'v1',
    },
  });
}

async function main() {
  console.log('Starting entity features sync...');

  // Sync products
  const products = await prisma.product.findMany({
    take: 50,
    orderBy: { updatedAt: 'desc' },
  });

  let productCount = 0;
  for (const product of products) {
    try {
      await syncProductFeatures(product.id);
      productCount++;
      console.log(`✓ Synced product: ${product.name}`);
    } catch (error) {
      console.error(`✗ Failed to sync product ${product.id}:`, error.message);
    }
  }

  // Sync styles
  const styles = await prisma.style.findMany({
    where: { isActive: true },
    take: 50,
    orderBy: { updatedAt: 'desc' },
  });

  let styleCount = 0;
  for (const style of styles) {
    try {
      await syncStyleFeatures(style.id);
      styleCount++;
      console.log(`✓ Synced style: ${style.name}`);
    } catch (error) {
      console.error(`✗ Failed to sync style ${style.id}:`, error.message);
    }
  }

  console.log(`\nEntity features sync complete!`);
  console.log(`- Products synced: ${productCount}`);
  console.log(`- Styles synced: ${styleCount}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });














