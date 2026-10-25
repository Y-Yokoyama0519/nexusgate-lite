'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { type MapPin } from '@/lib/geo/map'
import { SYSTEM_CONFIG } from '@/config/system'

interface AssignMapProps {
  projectPin: MapPin | null
  partnerPins: MapPin[]
  selectedWorkerId?: string | null
  onSelectWorker?: (workerId: string) => void
  tileUrl?: string
}

function createPinIcon(type: 'project' | 'partner', isSelected = false) {
  const bgClass =
    type === 'project'
      ? 'bg-rose-600 text-white border-white ring-2 ring-rose-300'
      : isSelected
      ? 'bg-emerald-600 text-white border-white ring-2 ring-emerald-300'
      : 'bg-blue-600 text-white border-white hover:scale-110'

  const label = type === 'project' ? '現場' : '人'

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="flex items-center justify-center w-7 h-7 rounded-full shadow-md border-2 font-bold text-[11px] transition-transform ${bgClass}">
        ${label}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

export default function AssignMap({
  projectPin,
  partnerPins,
  selectedWorkerId,
  onSelectWorker,
  tileUrl = SYSTEM_CONFIG.geo.osmTileUrl,
}: AssignMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  // 地図の初期化（案件座標を中心に固定）
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !projectPin) return

    const map = L.map(mapContainerRef.current, {
      center: [projectPin.lat, projectPin.lng],
      zoom: 12,
      zoomControl: true,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    })

    // OpenStreetMap タイルレイヤー
    L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 18,
      minZoom: 8,
    }).addTo(map)

    const markersLayer = L.layerGroup().addTo(map)
    markersLayerRef.current = markersLayer
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [projectPin?.lat, projectPin?.lng, tileUrl])

  // ピンのプロット（Props の変更に応じて再描画）
  useEffect(() => {
    const map = mapInstanceRef.current
    const markersLayer = markersLayerRef.current
    if (!map || !markersLayer || !projectPin) return

    markersLayer.clearLayers()

    // 案件現場ピン（中央）
    const projectMarker = L.marker([projectPin.lat, projectPin.lng], {
      icon: createPinIcon('project'),
      zIndexOffset: 1000,
    }).bindPopup(`<strong>【現場】${projectPin.name}</strong>`)
    markersLayer.addLayer(projectMarker)

    // アサイン側から渡されたパートナーピン
    partnerPins.forEach((partner) => {
      const isSelected = partner.id === selectedWorkerId
      const marker = L.marker([partner.lat, partner.lng], {
        icon: createPinIcon('partner', isSelected),
        zIndexOffset: isSelected ? 500 : 100,
      }).bindPopup(`
        <div style="font-size:12px; line-height:1.4;">
          <strong>${partner.name}</strong><br/>
          直線: 約${partner.distanceKm ?? '-'} km
        </div>
      `)

      marker.on('click', () => {
        onSelectWorker?.(partner.id)
      })

      markersLayer.addLayer(marker)
    })

    map.setView([projectPin.lat, projectPin.lng], map.getZoom())
  }, [projectPin, partnerPins, selectedWorkerId, onSelectWorker])

  if (!projectPin) {
    return (
      <div className="h-[280px] w-full border rounded-md flex items-center justify-center text-xs text-muted-foreground bg-muted/20">
        現場住所が特定されると地図が表示されます
      </div>
    )
  }

  return (
    <div className="relative w-full h-[280px] rounded-md overflow-hidden border border-border">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-2 right-2 z-[400] bg-background/95 backdrop-blur-sm text-[11px] p-2 rounded shadow-sm border border-border space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
          <span>案件現場（固定）</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
          <span>抽出パートナー</span>
        </div>
      </div>
    </div>
  )
}