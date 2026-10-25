import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { geocodeAddress, toPostGisPoint } from '../src/lib/geo/address'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function runGeocodePassthrough(inputFilePath: string, outputFilePath: string, addressColumnIndex: number) {
  const fileStream = fs.createReadStream(inputFilePath)
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })
  const output = fs.createWriteStream(outputFilePath, { encoding: 'utf8' })

  let isHeader = true

  for await (const line of rl) {
    if (!line.trim()) continue

    if (isHeader) {
      // ヘッダー行に座標列を追加
      output.write(`${line.trim()},location,geocode_level\n`)
      isHeader = false
      continue
    }

    const cols = line.split(',')
    const address = cols[addressColumnIndex]?.replace(/^"|"$/g, '').trim()

    let locationPoint = ''
    let geocodeLevel = ''

    if (address) {
      const geo = await geocodeAddress(address)
      if (geo) {
        locationPoint = toPostGisPoint(geo) ?? ''
        geocodeLevel = String(geo.level)
      }
      // 国土地理院APIの負荷軽減（150ms スリープ）
      await sleep(150)
    }

    // 入力行の末尾にそのまま追記 (Passthrough)
    output.write(`${line.trim()},"\"${locationPoint}\"",${geocodeLevel}\n`)
  }

  console.log(`✅ Geocode completed: ${outputFilePath}`)
}

// 実行例: tsx scripts/geocode-passthrough.ts input.csv output.csv 7