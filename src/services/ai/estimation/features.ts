// Lightweight placeholder for features to satisfy imports
// In production this should load features from EntityFeature or business tables
import type { SubjectRef } from './types'

export async function getFeaturesByRef(subjectRef: SubjectRef): Promise<Record<string, any> | null> {
  // Return a minimal stub so rank() can proceed
  return {
    subjectType: subjectRef.entityType,
    subjectId: subjectRef.entityId || null,
  }
}


