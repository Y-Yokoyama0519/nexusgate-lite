'use server'

import { createClient } from '@/lib/supabase/server'
import { type PartnerTimelineCandidate, type ScheduleBlock } from '../schema'
import { geocodeAddress } from '@/lib/geo/address'
import { type MapPin } from '@/lib/geo/map'

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function extractShortArea(address: string | null): string {
  if (!address) return '現場'
  const clean = address.replace(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/, '')
  const match = clean.match(/^([^0-9０-９-]+)/)
  return match ? match[1].trim() : clean.slice(0, 10)
}

// 照会結果の戻り値型（合成型）
export interface AssignLookupResult {
  projectPin: MapPin
  partnerPins: MapPin[]
  candidates: PartnerTimelineCandidate[]
}

export async function fetchPartnerTimelines(params: {
  targetDate: string
  locationAddress: string
}): Promise<AssignLookupResult | null> {
  const supabase = await createClient()

  // 1. 現場住所のジオコーディング
  const geo = await geocodeAddress(params.locationAddress)
  if (!geo) return null

  const targetLat = geo.lat
  const targetLng = geo.lng

  const projectPin: MapPin = {
    id: 'project-target',
    name: params.locationAddress,
    lat: targetLat,
    lng: targetLng,
    type: 'project',
  }

  // 2. 周辺パートナーの照会（RPCで lat, lng も直接取得）
  const { data: nearbyWorkers, error: workerErr } = await supabase
    .rpc('get_nearby_partner_workers', {
      target_lat: targetLat,
      target_lng: targetLng,
      radius_km: 30.0,
    })

  if (workerErr || !nearbyWorkers || nearbyWorkers.length === 0) {
    return { projectPin, partnerPins: [], candidates: [] }
  }

  const targetWorkerIds = nearbyWorkers.map((w: { worker_id: string }) => w.worker_id)
  const workerDistMap = new Map(
    nearbyWorkers.map((w: {
      worker_id: string
      worker_name: string
      base_address: string
      distance_km: number
      lat: number
      lng: number
    }) => [w.worker_id, w])
  )

  // 3. 当日のシフト照会（available のみ）
  const { data: shifts } = await supabase
    .from('partner_shifts')
    .select('worker_id, start_time, end_time, status')
    .in('worker_id', targetWorkerIds)
    .eq('date', params.targetDate)
    .eq('status', 'available')

  if (!shifts || shifts.length === 0) {
    return { projectPin, partnerPins: [], candidates: [] }
  }

  const availableWorkerIds = shifts.map((s) => s.worker_id)
  const shiftMap = new Map(shifts.map((s) => [s.worker_id, s]))

  // 4. 既存案件ブロックの取得
  const dayStartIso = `${params.targetDate}T00:00:00+09:00`
  const dayEndIso = `${params.targetDate}T23:59:59+09:00`

  const { data: existingProjects } = await supabase
    .from('projects')
    .select('id, title, assigned_worker_id, scheduled_start_at, scheduled_end_at, address')
    .in('assigned_worker_id', availableWorkerIds)
    .in('status', ['assigned', 'in_progress'])
    .gte('scheduled_start_at', dayStartIso)
    .lte('scheduled_end_at', dayEndIso)

  // 5. ガントチャート用とマップピン用のデータをそれぞれ構築
  const candidates: PartnerTimelineCandidate[] = []
  const partnerPins: MapPin[] = []

  for (const workerId of availableWorkerIds) {
    const workerInfo = workerDistMap.get(workerId)
    const shift = shiftMap.get(workerId)
    if (!workerInfo || !shift) continue

    // マップ用ピン
    if (workerInfo.lat != null && workerInfo.lng != null) {
      partnerPins.push({
        id: workerInfo.worker_id,
        name: workerInfo.worker_name,
        lat: workerInfo.lat,
        lng: workerInfo.lng,
        type: 'partner',
        distanceKm: workerInfo.distance_km,
      })
    }

    // ガントチャート用候補情報（スキーマは一切汚さない）
    const shiftStartMin = timeToMinutes(shift.start_time)
    const shiftEndMin = timeToMinutes(shift.end_time)

    const workerProjects = (existingProjects || []).filter(
      (p) => p.assigned_worker_id === workerId && p.scheduled_start_at && p.scheduled_end_at
    )

    const blocks: ScheduleBlock[] = workerProjects.map((p) => {
      const sDate = new Date(p.scheduled_start_at!)
      const eDate = new Date(p.scheduled_end_at!)

      return {
        id: p.id,
        title: p.title,
        locationAddress: p.address,
        displayArea: extractShortArea(p.address),
        startMinutes: sDate.getHours() * 60 + sDate.getMinutes(),
        endMinutes: eDate.getHours() * 60 + eDate.getMinutes(),
        startTimeStr: sDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        endTimeStr: eDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      }
    })

    candidates.push({
      workerId: workerInfo.worker_id,
      workerName: workerInfo.worker_name,
      baseAddress: workerInfo.base_address,
      distanceKm: workerInfo.distance_km,
      shiftStart: shift.start_time.slice(0, 5),
      shiftEnd: shift.end_time.slice(0, 5),
      shiftStartMinutes: shiftStartMin,
      shiftEndMinutes: shiftEndMin,
      blocks,
    })
  }

  return {
    projectPin,
    partnerPins,
    candidates: candidates.sort((a, b) => a.distanceKm - b.distanceKm),
  }
}