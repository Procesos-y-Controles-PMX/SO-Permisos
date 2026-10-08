'use client'

import { useState, useCallback, useEffect } from 'react'
import { getStoreComplianceMap } from '@/lib/api/dashboard'

export function useStoreCompliance() {
  const [storeComplianceMap, setStoreComplianceMap] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      setStoreComplianceMap(await getStoreComplianceMap())
    } catch (e) {
      console.error('Error fetching store compliance:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  return { storeComplianceMap, loading, refetch: fetchStats }
}
