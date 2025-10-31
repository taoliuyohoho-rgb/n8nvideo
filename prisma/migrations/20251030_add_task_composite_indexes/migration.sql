-- CreateIndex
CREATE INDEX "tasks_status_createdAt_idx" ON "tasks"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "tasks_type_createdAt_idx" ON "tasks"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "tasks_status_type_createdAt_idx" ON "tasks"("status", "type", "createdAt" DESC);

