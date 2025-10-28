-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "sellingPoints" JSONB,
    "skuImages" TEXT,
    "targetCountries" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceUserId" TEXT,
    "isUserGenerated" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "lastUserUpdate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "painPoints" JSONB,
    "painPointsLastUpdate" TIMESTAMP(3),
    "painPointsSource" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "styles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "tone" TEXT NOT NULL,
    "scriptStructure" TEXT,
    "visualStyle" TEXT,
    "targetAudience" TEXT,
    "productId" TEXT,
    "templatePerformance" DOUBLE PRECISION,
    "hookPool" TEXT,
    "targetCountries" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "productId" TEXT NOT NULL,
    "styleId" TEXT,
    "structure" TEXT NOT NULL,
    "hookPool" TEXT NOT NULL,
    "videoStylePool" TEXT NOT NULL,
    "tonePool" TEXT NOT NULL,
    "suggestedLength" TEXT NOT NULL,
    "recommendedCategories" TEXT NOT NULL,
    "targetCountries" TEXT NOT NULL,
    "templatePrompt" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceVideoId" TEXT,
    "sourceUserId" TEXT,
    "isUserGenerated" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "videoAnalysisAI" TEXT,
    "promptGenerationAI" TEXT,
    "videoGenerationAI" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoUrl" TEXT,
    "videoTitle" TEXT,
    "videoDescription" TEXT,
    "generatedPrompt" TEXT,
    "promptGenerationAI" TEXT,
    "videoGenerationAI" TEXT,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_data" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "shopId" TEXT,
    "spend" DOUBLE PRECISION,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "views" INTEGER,
    "ctr" DOUBLE PRECISION,
    "ctr3s" DOUBLE PRECISION,
    "ctrComplete" DOUBLE PRECISION,
    "conversions" INTEGER,
    "cvr" DOUBLE PRECISION,
    "gmv" DOUBLE PRECISION,
    "orders" INTEGER,
    "likes" INTEGER,
    "shares" INTEGER,
    "comments" INTEGER,
    "userDemographics" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_analyses" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "videoId" TEXT,
    "analysis" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_analyses" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "views" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "uploadDate" TIMESTAMP(3),
    "script" TEXT,
    "keyPoints" TEXT,
    "callToAction" TEXT,
    "hashtags" TEXT,
    "mentions" TEXT,
    "productName" TEXT,
    "sellingPoints" TEXT,
    "marketingInfo" TEXT,
    "targetAudience" TEXT,
    "price" DOUBLE PRECISION,
    "currency" TEXT,
    "discount" TEXT,
    "videoQuality" DOUBLE PRECISION,
    "audioQuality" DOUBLE PRECISION,
    "editingStyle" TEXT,
    "colorGrading" TEXT,
    "transitions" TEXT,
    "aiAnalysis" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitor_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_videos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "size" INTEGER,
    "format" TEXT,
    "analysis" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,
    "tags" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "performanceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_analyses" (
    "id" TEXT NOT NULL,
    "videoId" TEXT,
    "referenceVideoId" TEXT,
    "competitorId" TEXT,
    "duration" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "fps" INTEGER NOT NULL,
    "bitrate" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "resolution" TEXT NOT NULL,
    "clarity" DOUBLE PRECISION NOT NULL,
    "stability" DOUBLE PRECISION NOT NULL,
    "colorAccuracy" DOUBLE PRECISION NOT NULL,
    "scenes" TEXT,
    "objects" TEXT,
    "text" TEXT,
    "audio" TEXT,
    "aiAnalysis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_results" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "candidates" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "processingTime" INTEGER NOT NULL,
    "context" TEXT,
    "userProfile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_mappings" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformProductId" TEXT NOT NULL,
    "platformName" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "suggestedBy" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" TEXT,

    CONSTRAINT "product_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_pain_points" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "productUrl" TEXT,
    "productName" TEXT NOT NULL,
    "painPoints" TEXT NOT NULL,
    "painCategories" TEXT,
    "severity" TEXT,
    "frequency" INTEGER,
    "aiAnalysis" TEXT,
    "keywords" TEXT,
    "sentiment" TEXT,
    "sourceData" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pain_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_comments" (
    "id" TEXT NOT NULL,
    "painPointId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "author" TEXT,
    "publishDate" TIMESTAMP(3),
    "likes" INTEGER,
    "replies" INTEGER,
    "sentiment" TEXT,
    "keywords" TEXT,
    "painPointTags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_scraping_tasks" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "keywords" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "maxComments" INTEGER NOT NULL DEFAULT 100,
    "dateRange" TEXT,
    "filters" TEXT,
    "totalFound" INTEGER,
    "scraped" INTEGER,
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "comment_scraping_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT,
    "data" TEXT NOT NULL,
    "originalData" TEXT,
    "source" TEXT NOT NULL,
    "sourceVideoId" TEXT,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessModule" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT,
    "description" TEXT,
    "performance" DOUBLE PRECISION,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimation_models" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "version" TEXT,
    "langs" TEXT NOT NULL,
    "maxContext" INTEGER NOT NULL,
    "pricePer1kTokens" DOUBLE PRECISION NOT NULL,
    "rateLimit" INTEGER,
    "toolUseSupport" BOOLEAN NOT NULL DEFAULT false,
    "jsonModeSupport" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "staticCapability" TEXT,
    "dynamicMetrics" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimation_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_index" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "nativeTable" TEXT NOT NULL,
    "nativeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_features" (
    "id" TEXT NOT NULL,
    "entityIndexId" TEXT NOT NULL,
    "featureGroup" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "featuresVersion" TEXT NOT NULL DEFAULT 'v1',
    "validAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_embeddings" (
    "id" TEXT NOT NULL,
    "entityIndexId" TEXT NOT NULL,
    "space" TEXT NOT NULL DEFAULT 'default',
    "vector" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_metrics_daily" (
    "id" TEXT NOT NULL,
    "entityIndexId" TEXT NOT NULL,
    "segmentKey" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION,
    "editRate" DOUBLE PRECISION,
    "rejectionRate" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "latency" DOUBLE PRECISION,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_metrics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimation_candidate_sets" (
    "id" TEXT NOT NULL,
    "taskSnapshot" TEXT NOT NULL,
    "contextSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimation_candidate_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimation_candidates" (
    "id" TEXT NOT NULL,
    "candidateSetId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "coarseScore" DOUBLE PRECISION,
    "fineScore" DOUBLE PRECISION,
    "reason" TEXT,
    "filtered" BOOLEAN NOT NULL DEFAULT false,
    "filterReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimation_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimation_decisions" (
    "id" TEXT NOT NULL,
    "candidateSetId" TEXT NOT NULL,
    "chosenModelId" TEXT NOT NULL,
    "strategyVersion" TEXT NOT NULL DEFAULT 'v1',
    "weightsSnapshot" TEXT,
    "topK" INTEGER NOT NULL DEFAULT 5,
    "exploreFlags" TEXT,
    "expectedCost" DOUBLE PRECISION,
    "expectedLatency" DOUBLE PRECISION,
    "requestId" TEXT,
    "segmentKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimation_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimation_outcomes" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION,
    "editDistance" DOUBLE PRECISION,
    "rejected" BOOLEAN,
    "conversion" BOOLEAN,
    "latencyMs" INTEGER,
    "costActual" DOUBLE PRECISION,
    "tokensInput" INTEGER,
    "tokensOutput" INTEGER,
    "autoEval" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimation_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimation_feedback_events" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimation_feedback_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reco_candidate_sets" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT,
    "subjectSnapshot" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "contextSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reco_candidate_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reco_candidates" (
    "id" TEXT NOT NULL,
    "candidateSetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "coarseScore" DOUBLE PRECISION,
    "fineScore" DOUBLE PRECISION,
    "reason" TEXT,
    "filtered" BOOLEAN NOT NULL DEFAULT false,
    "filterReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reco_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reco_decisions" (
    "id" TEXT NOT NULL,
    "candidateSetId" TEXT NOT NULL,
    "chosenTargetType" TEXT NOT NULL,
    "chosenTargetId" TEXT NOT NULL,
    "strategyVersion" TEXT NOT NULL DEFAULT 'v1',
    "weightsSnapshot" TEXT,
    "topK" INTEGER NOT NULL DEFAULT 5,
    "exploreFlags" TEXT,
    "requestId" TEXT,
    "segmentKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reco_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reco_outcomes" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION,
    "editDistance" DOUBLE PRECISION,
    "rejected" BOOLEAN,
    "conversion" BOOLEAN,
    "latencyMs" INTEGER,
    "costActual" DOUBLE PRECISION,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reco_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reco_events" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reco_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_settings" (
    "id" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'rule',
    "mCoarse" INTEGER NOT NULL DEFAULT 10,
    "kFine" INTEGER NOT NULL DEFAULT 3,
    "epsilon" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "minExplore" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "diversity" BOOLEAN NOT NULL DEFAULT true,
    "qualityFloorRej" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "qualityFloorStr" DOUBLE PRECISION NOT NULL DEFAULT 0.90,
    "costOverrunMul" DOUBLE PRECISION NOT NULL DEFAULT 1.50,
    "latencySoftMs" INTEGER NOT NULL DEFAULT 6000,
    "latencyHardMs" INTEGER NOT NULL DEFAULT 8000,
    "segmentTemplate" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reco_feedback" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "chosenCandidateId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reco_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "templates_templateId_key" ON "templates"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "competitor_analyses_url_key" ON "competitor_analyses"("url");

-- CreateIndex
CREATE INDEX "prompt_templates_businessModule_idx" ON "prompt_templates"("businessModule");

-- CreateIndex
CREATE INDEX "estimation_models_status_idx" ON "estimation_models"("status");

-- CreateIndex
CREATE UNIQUE INDEX "estimation_models_provider_modelName_key" ON "estimation_models"("provider", "modelName");

-- CreateIndex
CREATE INDEX "entity_index_entityType_status_idx" ON "entity_index"("entityType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "entity_index_entityType_nativeId_key" ON "entity_index"("entityType", "nativeId");

-- CreateIndex
CREATE INDEX "entity_features_entityIndexId_featureGroup_idx" ON "entity_features"("entityIndexId", "featureGroup");

-- CreateIndex
CREATE UNIQUE INDEX "entity_embeddings_entityIndexId_space_key" ON "entity_embeddings"("entityIndexId", "space");

-- CreateIndex
CREATE INDEX "entity_metrics_daily_segmentKey_date_idx" ON "entity_metrics_daily"("segmentKey", "date");

-- CreateIndex
CREATE UNIQUE INDEX "entity_metrics_daily_entityIndexId_segmentKey_date_key" ON "entity_metrics_daily"("entityIndexId", "segmentKey", "date");

-- CreateIndex
CREATE INDEX "estimation_candidate_sets_createdAt_idx" ON "estimation_candidate_sets"("createdAt");

-- CreateIndex
CREATE INDEX "estimation_candidates_candidateSetId_idx" ON "estimation_candidates"("candidateSetId");

-- CreateIndex
CREATE INDEX "estimation_candidates_modelId_idx" ON "estimation_candidates"("modelId");

-- CreateIndex
CREATE INDEX "estimation_decisions_candidateSetId_idx" ON "estimation_decisions"("candidateSetId");

-- CreateIndex
CREATE INDEX "estimation_decisions_chosenModelId_idx" ON "estimation_decisions"("chosenModelId");

-- CreateIndex
CREATE INDEX "estimation_decisions_segmentKey_createdAt_idx" ON "estimation_decisions"("segmentKey", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "estimation_decisions_requestId_key" ON "estimation_decisions"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "estimation_outcomes_decisionId_key" ON "estimation_outcomes"("decisionId");

-- CreateIndex
CREATE INDEX "estimation_outcomes_decisionId_idx" ON "estimation_outcomes"("decisionId");

-- CreateIndex
CREATE INDEX "estimation_feedback_events_decisionId_eventType_idx" ON "estimation_feedback_events"("decisionId", "eventType");

-- CreateIndex
CREATE INDEX "estimation_feedback_events_createdAt_idx" ON "estimation_feedback_events"("createdAt");

-- CreateIndex
CREATE INDEX "reco_candidate_sets_createdAt_idx" ON "reco_candidate_sets"("createdAt");

-- CreateIndex
CREATE INDEX "reco_candidates_candidateSetId_idx" ON "reco_candidates"("candidateSetId");

-- CreateIndex
CREATE INDEX "reco_candidates_targetType_targetId_idx" ON "reco_candidates"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "reco_decisions_candidateSetId_idx" ON "reco_decisions"("candidateSetId");

-- CreateIndex
CREATE INDEX "reco_decisions_chosenTargetType_chosenTargetId_idx" ON "reco_decisions"("chosenTargetType", "chosenTargetId");

-- CreateIndex
CREATE INDEX "reco_decisions_segmentKey_createdAt_idx" ON "reco_decisions"("segmentKey", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "reco_decisions_requestId_key" ON "reco_decisions"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "reco_outcomes_decisionId_key" ON "reco_outcomes"("decisionId");

-- CreateIndex
CREATE INDEX "reco_outcomes_decisionId_idx" ON "reco_outcomes"("decisionId");

-- CreateIndex
CREATE INDEX "reco_events_decisionId_eventType_idx" ON "reco_events"("decisionId", "eventType");

-- CreateIndex
CREATE INDEX "reco_events_createdAt_idx" ON "reco_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_settings_scenario_key" ON "recommendation_settings"("scenario");

-- CreateIndex
CREATE INDEX "reco_feedback_decisionId_idx" ON "reco_feedback"("decisionId");

-- CreateIndex
CREATE INDEX "reco_feedback_feedbackType_idx" ON "reco_feedback"("feedbackType");

-- CreateIndex
CREATE INDEX "reco_feedback_chosenCandidateId_idx" ON "reco_feedback"("chosenCandidateId");

-- CreateIndex
CREATE INDEX "reco_feedback_createdAt_idx" ON "reco_feedback"("createdAt");

-- AddForeignKey
ALTER TABLE "styles" ADD CONSTRAINT "styles_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_data" ADD CONSTRAINT "ad_data_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_analyses" ADD CONSTRAINT "template_analyses_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_mappings" ADD CONSTRAINT "product_mappings_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_pain_points" ADD CONSTRAINT "product_pain_points_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_comments" ADD CONSTRAINT "product_comments_painPointId_fkey" FOREIGN KEY ("painPointId") REFERENCES "product_pain_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_features" ADD CONSTRAINT "entity_features_entityIndexId_fkey" FOREIGN KEY ("entityIndexId") REFERENCES "entity_index"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_embeddings" ADD CONSTRAINT "entity_embeddings_entityIndexId_fkey" FOREIGN KEY ("entityIndexId") REFERENCES "entity_index"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_metrics_daily" ADD CONSTRAINT "entity_metrics_daily_entityIndexId_fkey" FOREIGN KEY ("entityIndexId") REFERENCES "entity_index"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_candidates" ADD CONSTRAINT "estimation_candidates_candidateSetId_fkey" FOREIGN KEY ("candidateSetId") REFERENCES "estimation_candidate_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_candidates" ADD CONSTRAINT "estimation_candidates_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "estimation_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_decisions" ADD CONSTRAINT "estimation_decisions_candidateSetId_fkey" FOREIGN KEY ("candidateSetId") REFERENCES "estimation_candidate_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_outcomes" ADD CONSTRAINT "estimation_outcomes_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "estimation_decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_feedback_events" ADD CONSTRAINT "estimation_feedback_events_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "estimation_decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reco_candidates" ADD CONSTRAINT "reco_candidates_candidateSetId_fkey" FOREIGN KEY ("candidateSetId") REFERENCES "reco_candidate_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reco_decisions" ADD CONSTRAINT "reco_decisions_candidateSetId_fkey" FOREIGN KEY ("candidateSetId") REFERENCES "reco_candidate_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reco_outcomes" ADD CONSTRAINT "reco_outcomes_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "reco_decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reco_events" ADD CONSTRAINT "reco_events_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "reco_decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
