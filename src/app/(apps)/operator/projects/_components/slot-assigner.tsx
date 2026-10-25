'use client'

import { useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { fetchPartnerTimelines } from '../assign/actions'
import { type PartnerTimelineCandidate } from '../schema'
import { MapPin as MapPinIcon, Clock, CheckCircle2 } from 'lucide-react'
import { type MapPin } from '@/lib/geo/map'

// SSR 無効化で遅延読み込み
const AssignMap = dynamic(() => import('./assign-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] w-full bg-muted/20 animate-pulse rounded-md flex items-center justify-center text-xs text-muted-foreground border">
      地図コンポーネントを読み込み中...
    </div>
  ),
})

interface SlotAssignerProps {
  targetDate: string
  locationAddress: string
  selectedWorkerId?: string | null
  onSelectSlot: (slot: {
    workerId: string
    workerName: string
    workerCoords?: { lat: number; lng: number }
  }) => void
}

// タイムライン描画範囲（08:30 〜 18:30 = 計600分）
const TIMELINE_START_MIN = 8.5 * 60
const TIMELINE_END_MIN = 18.5 * 60
const TOTAL_MINUTES = TIMELINE_END_MIN - TIMELINE_START_MIN

const TIME_MARKS = ['09:00', '11:00', '13:00', '15:00', '17:00', '18:00']

export function SlotAssigner({
  targetDate,
  locationAddress,
  selectedWorkerId,
  onSelectSlot,
}: SlotAssignerProps) {
  const [isPending, startTransition] = useTransition()
  const [candidates, setCandidates] = useState<PartnerTimelineCandidate[]>([])
  const [projectPin, setProjectPin] = useState<MapPin | null>(null)
  const [partnerPins, setPartnerPins] = useState<MapPin[]>([])
  const [hasQueried, setHasQueried] = useState(false)

  const handleQuery = () => {
    if (!locationAddress.trim() || !targetDate) return

    startTransition(async () => {
      const res = await fetchPartnerTimelines({
        targetDate,
        locationAddress,
      })

      if (res) {
        setCandidates(res.candidates)
        setProjectPin(res.projectPin)
        setPartnerPins(res.partnerPins)
      } else {
        setCandidates([])
        setProjectPin(null)
        setPartnerPins([])
      }
      setHasQueried(true)
    })
  }

  const getPositionStyle = (startMin: number, endMin: number) => {
    const clampedStart = Math.max(startMin, TIMELINE_START_MIN)
    const clampedEnd = Math.min(endMin, TIMELINE_END_MIN)
    const leftPercent = ((clampedStart - TIMELINE_START_MIN) / TOTAL_MINUTES) * 100
    const widthPercent = Math.max(((clampedEnd - clampedStart) / TOTAL_MINUTES) * 100, 2)
    return { left: `${leftPercent}%`, width: `${widthPercent}%` }
  }

  const handleSelectPartnerById = (workerId: string) => {
    const cand = candidates.find((c) => c.workerId === workerId)
    const pin = partnerPins.find((p) => p.id === workerId)
    if (cand) {
      onSelectSlot({
        workerId: cand.workerId,
        workerName: cand.workerName,
        workerCoords: pin ? { lat: pin.lat, lng: pin.lng } : undefined,
      })
    }
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              シフト・アサインガントチャート
            </CardTitle>
            <CardDescription className="text-xs">
              現場から30km以内で稼働可能なパートナーの当日スケジュールを表示します。
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleQuery}
            disabled={isPending || !locationAddress.trim()}
          >
            {isPending ? '照会中...' : 'タイムラインを照会'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasQueried && !isPending && (
          <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-md">
            現場住所と希望日を入力後、「タイムラインを照会」を押すと周辺パートナーのスケジュールが表示されます。
          </p>
        )}

        {hasQueried && candidates.length === 0 && !isPending && (
          <p className="text-xs text-destructive text-center py-4 border border-dashed rounded-md bg-destructive/5">
            半径30km以内で該当日に稼働可能なパートナーが見つかりませんでした。
          </p>
        )}

        {candidates.length > 0 && (
          <div className="space-y-4">
            {/* 1. 国土地理院マップ（案件現場中央固定） */}
            <AssignMap
              projectPin={projectPin}
              partnerPins={partnerPins}
              selectedWorkerId={selectedWorkerId}
              onSelectWorker={handleSelectPartnerById}
            />

            {/* 2. 時間軸ヘッダー */}
            <div className="flex border-b pb-1 text-[11px] font-semibold text-muted-foreground pl-[180px]">
              <div className="relative w-full h-4">
                {TIME_MARKS.map((mark) => {
                  const mMinutes = Number(mark.split(':')[0]) * 60 + Number(mark.split(':')[1])
                  const left = `${((mMinutes - TIMELINE_START_MIN) / TOTAL_MINUTES) * 100}%`
                  return (
                    <span key={mark} className="absolute -translate-x-1/2" style={{ left }}>
                      {mark}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* 3. パートナー別 タイムライン行 */}
            <div className="space-y-2">
              {candidates.map((cand) => {
                const isSelected = selectedWorkerId === cand.workerId
                const shiftPos = getPositionStyle(cand.shiftStartMinutes, cand.shiftEndMinutes)

                return (
                  <div
                    key={cand.workerId}
                    onClick={() => handleSelectPartnerById(cand.workerId)}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    {/* 左側：パートナー情報 */}
                    <div className="w-[180px] shrink-0 text-left">
                      <div className="text-xs font-semibold flex items-center justify-between pr-2">
                        <span className="truncate" title={cand.workerName}>
                          {cand.workerName}
                        </span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPinIcon className="h-3 w-3 shrink-0" />
                        <span>直線 約{cand.distanceKm} km</span>
                        <span className="text-border">|</span>
                        <span>{cand.shiftStart}〜{cand.shiftEnd}</span>
                      </div>
                    </div>

                    {/* 右側：ガントチャートバー */}
                    <div className="relative flex-1 h-7 bg-muted/40 rounded overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 bg-background/90 border-x border-dashed border-border"
                        style={shiftPos}
                        title={`稼働枠: ${cand.shiftStart} 〜 ${cand.shiftEnd}`}
                      />

                      {cand.blocks.map((block) => {
                        const blockPos = getPositionStyle(block.startMinutes, block.endMinutes)
                        return (
                          <div
                            key={block.id}
                            className="absolute top-1 bottom-1 bg-amber-500/20 border border-amber-500/40 rounded px-1.5 flex items-center overflow-hidden z-10"
                            style={blockPos}
                            title={`${block.title}\n時間: ${block.startTimeStr}〜${block.endTimeStr}\n場所: ${block.locationAddress ?? '-'}`}
                          >
                            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 truncate">
                              [{block.displayArea}] {block.startTimeStr}〜
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
                  既存案件（現場エリア）
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-background border border-dashed border-border" />
                  稼働可能シフト枠
                </span>
              </div>
              <span>※行または地図上のピンをクリックして担当者を選択できます</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}