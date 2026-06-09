import Papa from 'papaparse'

export type Recipe = {
  id: string
  title: string
  creator: string
  handle: string
  cuisine: string
  reelUrl: string
  views: string
  hasAiRecipe: boolean
  videoId: string
}

const SHEET_CSV_URL = import.meta.env.VITE_SHEET_CSV_URL as string | undefined
const CREATORS_CSV_URL = import.meta.env.VITE_CREATORS_CSV_URL as string | undefined

export type CreatorInfo = {
  handle: string
  name: string
  thumbnailUrl: string
  channelUrl: string
}

export async function loadCreators(): Promise<CreatorInfo[]> {
  if (!CREATORS_CSV_URL) return []
  try {
    const res = await fetch(CREATORS_CSV_URL)
    if (!res.ok) return []
    const { data } = Papa.parse<Record<string, string>>(await res.text(), {
      header: true, skipEmptyLines: true,
    })
    return data.map(r => ({
      handle: (r['Handle'] || r['handle'] || '').trim(),
      name: (r['Name'] || r['name'] || '').trim(),
      thumbnailUrl: (r['ThumbnailUrl'] || r['thumbnailurl'] || '').trim(),
      channelUrl: (r['ChannelUrl'] || r['channelurl'] || '').trim(),
    })).filter(r => r.handle)
  } catch {
    return []
  }
}

function normalize(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k in row) out[k.trim().toLowerCase()] = (row[k] ?? '').trim()
  return out
}

function rowToRecipe(raw: Record<string, string>, i: number): Recipe | null {
  const r = normalize(raw)
  const title = r['title'] || ''
  if (!title) return null

  return {
    id: `recipe-${i}`,
    title,
    creator: r['creator'] || '',
    handle: r['handle'] || '',
    cuisine: r['cuisine'] || 'American',
    reelUrl: r['reelurl'] || '',
    views: r['views'] || '',
    hasAiRecipe: r['hasairecipe']?.toLowerCase() === 'true',
    videoId: r['videoid'] || '',
  }
}

export async function loadCatalog(): Promise<Recipe[]> {
  if (!SHEET_CSV_URL) return []
  try {
    const res = await fetch(SHEET_CSV_URL)
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)
    const { data } = Papa.parse<Record<string, string>>(await res.text(), {
      header: true,
      skipEmptyLines: true,
    })
    return data
      .map((row, i) => rowToRecipe(row, i))
      .filter((r): r is Recipe => r !== null)
  } catch (err) {
    console.warn('[catalog] sheet load failed:', err)
    return []
  }
}
