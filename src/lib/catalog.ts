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
  recipe?: string
  publishedAt?: string
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

// Creators whose content isn't actually cooking recipes (e.g. kids' songs)
// and should never show up in the catalog.
const BLOCKED_HANDLES = new Set([
  '@cocomelonnurseryrhymes',
  '@lasrecetasdesimn',
])

// Matches scripts other than basic Latin (Cyrillic, CJK, Arabic, Hebrew, etc.)
// so non-English titles don't display in the catalog.
const NON_LATIN_SCRIPT = /[Ѐ-ӿ֐-ࣿऀ-෿฀-๿　-鿿가-힯豈-﫿＀-￯]/

function rowToRecipe(raw: Record<string, string>, i: number): Recipe | null {
  const r = normalize(raw)
  const title = r['title'] || ''
  if (!title) return null
  if (BLOCKED_HANDLES.has((r['handle'] || '').toLowerCase())) return null
  if (NON_LATIN_SCRIPT.test(title)) return null

  return {
    id: `recipe-${i}`,
    title,
    creator: r['creator'] || '',
    handle: r['handle'] || '',
    cuisine: r['cuisine'] || 'American',
    reelUrl: r['reelurl'] || '',
    views: r['views'] || '',
    videoId: r['videoid'] || '',
    recipe: r['recipe']?.startsWith('{') ? r['recipe'] : undefined,
    hasAiRecipe: (r['recipe'] || '').startsWith('{'),
    publishedAt: r['publishedat'] || undefined,
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
