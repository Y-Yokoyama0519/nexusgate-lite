/**
 * NexusGate システム全体の一元管理設定
 */
export const SYSTEM_CONFIG = {
  /**
   * 地理空間・位置情報（Geo / PostGIS）および外部API関連設定
   */
  geo: {
    // パートナー足切り用の検索半径（km）
    searchRadiusKm: 30.0,
    // ジオコーディングで合格とする最低精度レベル（3: 市区町村以上）
    minGeocodeLevel: 3,
    // 国土地理院 住所検索APIエンドポイント
    gsiAddressSearchUrl: 'https://msearch.gsi.go.jp/address-search/AddressSearch',
    // 郵便番号住所検索APIエンドポイント（madefor/postal-code-api on jsDelivr CDN）
    postalApiBaseUrl: 'https://cdn.jsdelivr.net/gh/madefor/postal-code-api@v1/api/v1',
    // OpenStreetMap タイルURL
    osmTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },

  /**
   * アサイン・タイムライン（ガントチャート）表示設定
   */
  timeline: {
    // タイムライン描画の開始時刻（時・24時間表記）
    startHour: 8.5, // 08:30
    // タイムライン描画の終了時刻（時・24時間表記）
    endHour: 18.5,  // 18:30
    // 目盛り表示を行う代表時刻
    timeMarks: ['09:00', '11:00', '13:00', '15:00', '17:00', '18:00'],
  },
} as const

export type SystemConfig = typeof SYSTEM_CONFIG