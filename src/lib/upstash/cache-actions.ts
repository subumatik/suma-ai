'use server'

import { invalidateDashboard, invalidatePatientList, invalidateAnalysis, invalidateReports } from './cache'

export async function invalidateDashboardCache(userId: string) {
  await invalidateDashboard(userId)
}

export async function invalidatePatientListCache(userId: string) {
  await invalidatePatientList(userId)
}

export async function invalidateAnalysisCache(analysisId: string) {
  await invalidateAnalysis(analysisId)
}

export async function invalidateReportsCache(userId: string) {
  await invalidateReports(userId)
}
