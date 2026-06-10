var SHEET_NAME = 'Reels'
var MAX_PAGES_PER_RUN = 4

var FULL_CHANNELS = [
  { channelId: 'UCCraUx678pr5_5A3PnV36lQ', creator: 'Justine',       handle: '@justineskitchen', cuisine: 'American' },
  { channelId: 'UC0oyuOrKgGq4k9TaL81ONnA', creator: 'Holmes Cooking', handle: '@holmescooking',   cuisine: 'American' },
  { channelId: 'UCZiLwxZjIZxjcubBW4i5V8A', creator: 'CoreyAlicia',   handle: '@CoreyAlicia',     cuisine: 'American' },
]

var SEARCHES = [
  { query: 'italian pasta recipe reel',       cuisine: 'Italian'       },
  { query: 'asian noodles recipe short',      cuisine: 'Asian'         },
  { query: 'mexican tacos recipe reel',       cuisine: 'Mexican'       },
  { query: 'dessert cake recipe short',       cuisine: 'Desserts'      },
  { query: 'american burger recipe reel',     cuisine: 'American'      },
  { query: 'mediterranean recipe short',      cuisine: 'Mediterranean' },
  { query: 'indian curry recipe reel',        cuisine: 'Indian'        },
  { query: 'breakfast pancakes recipe short', cuisine: 'Breakfast'     },
  { query: 'instant pot recipe short',        cuisine: 'American'      },
]

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 9).setValues([['Title', 'Creator', 'Handle', 'Cuisine', 'ReelURL', 'Views', 'HasAIRecipe', 'VideoID', 'PublishedAt']])
  }
  return sheet
}

// Returns the 1-based column index for a header, adding it to the end if missing.
function ensureColumn(sheet, headers, name) {
  var idx = headers.indexOf(name)
  if (idx !== -1) return idx + 1
  sheet.getRange(1, headers.length + 1).setValue(name)
  headers.push(name)
  return headers.length
}

function getExistingIds(sheet) {
  var lastRow = sheet.getLastRow()
  var existingIds = {}
  if (lastRow > 1) {
    var idCol = sheet.getRange(2, 8, lastRow - 1, 1).getValues()
    for (var i = 0; i < idCol.length; i++) {
      if (idCol[i][0]) existingIds[String(idCol[i][0])] = true
    }
  }
  return existingIds
}

function formatViews(countStr) {
  if (!countStr) return ''
  var n = parseInt(countStr)
  if (isNaN(n)) return ''
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return Math.round(n / 1000) + 'K'
  return String(n)
}

function getVideoViews(videoId) {
  try {
    var stats = YouTube.Videos.list('statistics', { id: videoId })
    if (stats.items && stats.items[0] && stats.items[0].statistics) {
      return formatViews(stats.items[0].statistics.viewCount)
    }
  } catch (e) {}
  return ''
}

// One-time backfill: fills PublishedAt for existing rows that don't have it yet.
function backfillPublishedDates() {
  var sheet = getSheet()
  var lastRow = sheet.getLastRow()
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  var publishedAtCol = ensureColumn(sheet, headers, 'PublishedAt')
  var videoIdIdx = headers.indexOf('VideoID')

  var lastCol = sheet.getLastColumn()
  var allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues()

  var rowsToFill = []
  for (var i = 0; i < allData.length; i++) {
    var existing = allData[i][publishedAtCol - 1]
    var videoId = String(allData[i][videoIdIdx] || '').trim()
    if (!existing && videoId) {
      rowsToFill.push({ row: i + 2, videoId: videoId })
    }
  }

  var updated = 0
  for (var b = 0; b < rowsToFill.length; b += 50) {
    var batch = rowsToFill.slice(b, b + 50)
    var ids = batch.map(function(r) { return r.videoId }).join(',')
    try {
      var result = YouTube.Videos.list('snippet', { id: ids })
      var byId = {}
      if (result.items) {
        for (var k = 0; k < result.items.length; k++) {
          byId[result.items[k].id] = result.items[k].snippet.publishedAt
        }
      }
      for (var m = 0; m < batch.length; m++) {
        var pub = byId[batch[m].videoId]
        if (pub) {
          sheet.getRange(batch[m].row, publishedAtCol).setValue(pub)
          updated++
        }
      }
    } catch (e) {
      Logger.log('Backfill batch error: ' + e)
    }
    Utilities.sleep(300)
  }

  var msg = 'Backfilled ' + updated + ' of ' + rowsToFill.length + ' rows with PublishedAt.'
  Logger.log(msg)
  SpreadsheetApp.getUi().alert(msg)
}

function scrapeChannels() {
  var sheet = getSheet()
  var existingIds = getExistingIds(sheet)
  var props = PropertiesService.getScriptProperties()
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  var publishedAtCol = ensureColumn(sheet, headers, 'PublishedAt')
  var totalAdded = 0
  var totalSkipped = 0

  for (var c = 0; c < FULL_CHANNELS.length; c++) {
    var ch = FULL_CHANNELS[c]
    var propKey = 'token_' + ch.channelId

    if (props.getProperty(propKey) === 'DONE') {
      Logger.log(ch.creator + ' already fully scraped')
      continue
    }

    var uploadsPlaylistId = null
    try {
      var channelInfo = YouTube.Channels.list('contentDetails', { id: ch.channelId })
      if (channelInfo.items && channelInfo.items[0]) {
        uploadsPlaylistId = channelInfo.items[0].contentDetails.relatedPlaylists.uploads
      }
    } catch (e) {
      Logger.log('Error getting playlist for ' + ch.creator + ': ' + e)
      continue
    }

    if (!uploadsPlaylistId) continue

    var pageToken = props.getProperty(propKey) || null
    var pagesThisRun = 0
    var rows = []
    var publishedAtRows = []

    while (pagesThisRun < MAX_PAGES_PER_RUN) {
      var params = { playlistId: uploadsPlaylistId, maxResults: 50 }
      if (pageToken) { params.pageToken = pageToken }

      var result = null
      try {
        result = YouTube.PlaylistItems.list('snippet', params)
      } catch (e) {
        Logger.log('Error fetching page for ' + ch.creator + ': ' + e)
        break
      }

      if (!result || !result.items) break

      for (var j = 0; j < result.items.length; j++) {
        var item = result.items[j]
        var videoId = item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId
        if (!videoId) continue
        if (existingIds[videoId]) { totalSkipped++; continue }

        var title = item.snippet.title || ''
        if (!title || title === 'Private video' || title === 'Deleted video') continue

        var views = getVideoViews(videoId)
        Utilities.sleep(100)

        rows.push([title, ch.creator, ch.handle, ch.cuisine, 'https://www.youtube.com/embed/' + videoId, views, 'false', videoId])
        publishedAtRows.push([item.snippet.publishedAt || ''])
        existingIds[videoId] = true
        totalAdded++
      }

      pageToken = result.nextPageToken || null
      pagesThisRun++

      if (!pageToken) {
        props.setProperty(propKey, 'DONE')
        Logger.log(ch.creator + ' fully scraped')
        break
      }

      Utilities.sleep(300)
    }

    if (pageToken) {
      props.setProperty(propKey, pageToken)
    }

    if (rows.length > 0) {
      var lastRow = sheet.getLastRow()
      sheet.getRange(lastRow + 1, 1, rows.length, 8).setValues(rows)
      sheet.getRange(lastRow + 1, publishedAtCol, publishedAtRows.length, 1).setValues(publishedAtRows)
    }
  }

  var msg = 'Done! Added ' + totalAdded + ' reels. Skipped ' + totalSkipped + ' dupes. Total: ' + (sheet.getLastRow() - 1)
  Logger.log(msg)
  SpreadsheetApp.getUi().alert(msg)
}

function scrapeSearches() {
  var sheet = getSheet()
  var existingIds = getExistingIds(sheet)
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  var publishedAtCol = ensureColumn(sheet, headers, 'PublishedAt')
  var MAX_RUNTIME_MS = 5 * 60 * 1000 // stop before Apps Script's execution limit; rerun to continue
  var startTime = Date.now()
  var totalAdded = 0
  var skipped = 0

  for (var s = 0; s < SEARCHES.length; s++) {
    if (Date.now() - startTime > MAX_RUNTIME_MS) {
      Logger.log('Stopping early to avoid timeout (ran ' + Math.round((Date.now() - startTime) / 1000) + 's).')
      break
    }

    var srch = SEARCHES[s]
    var rows = []
    var publishedAtRows = []
    try {
      var results = YouTube.Search.list('snippet', {
        q: srch.query,
        type: 'video',
        videoDuration: 'short',
        order: 'viewCount',
        maxResults: 50,
        relevanceLanguage: 'en',
        safeSearch: 'none',
      })

      if (!results || !results.items) continue

      for (var j = 0; j < results.items.length; j++) {
        var item = results.items[j]
        var videoId = item.id && item.id.videoId
        if (!videoId) continue
        if (existingIds[videoId]) { skipped++; continue }

        var snippet = item.snippet
        var channelTitle = snippet.channelTitle || ''
        var handle = '@' + channelTitle.toLowerCase().replace(/[^a-z0-9]/g, '')
        var views = getVideoViews(videoId)
        Utilities.sleep(100)

        rows.push([snippet.title, channelTitle, handle, srch.cuisine, 'https://www.youtube.com/embed/' + videoId, views, 'false', videoId])
        publishedAtRows.push([snippet.publishedAt || ''])
        existingIds[videoId] = true
      }

      Utilities.sleep(500)
    } catch (err) {
      Logger.log('Error on ' + srch.query + ': ' + err)
    }

    if (rows.length > 0) {
      var lastRow = sheet.getLastRow()
      sheet.getRange(lastRow + 1, 1, rows.length, 8).setValues(rows)
      sheet.getRange(lastRow + 1, publishedAtCol, publishedAtRows.length, 1).setValues(publishedAtRows)
      totalAdded += rows.length
    }
  }

  var msg = 'Done in ' + Math.round((Date.now() - startTime) / 1000) + 's! Added ' + totalAdded + ' reels. Skipped ' + skipped + ' dupes. Total: ' + (sheet.getLastRow() - 1)
  Logger.log(msg)
  SpreadsheetApp.getUi().alert(msg)
}

function scrapeAll() {
  scrapeChannels()
  scrapeSearches()
}

function scrapeCreatorThumbnails() {
  var apiKey = PropertiesService.getScriptProperties().getProperty('YOUTUBE_API_KEY')
  if (!apiKey) {
    SpreadsheetApp.getUi().alert('Missing YOUTUBE_API_KEY in Script Properties. See setup instructions.')
    return
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var reelsSheet = ss.getSheetByName(SHEET_NAME)
  if (!reelsSheet) { SpreadsheetApp.getUi().alert('No Reels sheet found.'); return }

  var lastRow = reelsSheet.getLastRow()
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('No data in Reels sheet.'); return }

  var data = reelsSheet.getRange(2, 2, lastRow - 1, 2).getValues()
  var seen = {}
  var creators = []
  for (var i = 0; i < data.length; i++) {
    var name = String(data[i][0]).trim()
    var handle = String(data[i][1]).trim()
    if (!handle || seen[handle]) continue
    seen[handle] = true
    creators.push({ name: name, handle: handle })
  }
  Logger.log('Found ' + creators.length + ' unique creators in Reels sheet')

  var creatorSheet = ss.getSheetByName('Creators')
  if (!creatorSheet) { creatorSheet = ss.insertSheet('Creators') }
  creatorSheet.clearContents()
  creatorSheet.getRange(1, 1, 1, 4).setValues([['Handle', 'Name', 'ThumbnailUrl', 'ChannelUrl']])

  var rows = []
  var failed = 0

  for (var c = 0; c < creators.length; c++) {
    var cr = creators[c]
    var cleanHandle = cr.handle.replace(/^@/, '')
    try {
      var url = 'https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=' + encodeURIComponent(cleanHandle) + '&key=' + apiKey
      var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true })
      var code = response.getResponseCode()
      if (code !== 200) {
        Logger.log('HTTP ' + code + ' for ' + cr.handle + ': ' + response.getContentText())
        failed++
        Utilities.sleep(500)
        continue
      }
      var result = JSON.parse(response.getContentText())
      if (!result.items || !result.items[0]) {
        Logger.log('No channel found for handle: ' + cr.handle)
        failed++
        Utilities.sleep(300)
        continue
      }
      var snippet = result.items[0].snippet
      var thumbUrl = ''
      if (snippet.thumbnails) {
        if (snippet.thumbnails.high) { thumbUrl = snippet.thumbnails.high.url }
        else if (snippet.thumbnails.medium) { thumbUrl = snippet.thumbnails.medium.url }
        else if (snippet.thumbnails.default) { thumbUrl = snippet.thumbnails.default.url }
      }
      rows.push([cr.handle, snippet.title || cr.name, thumbUrl, 'https://www.youtube.com/@' + cleanHandle])
      Utilities.sleep(300)
    } catch (e) {
      Logger.log('Error for ' + cr.handle + ': ' + e)
      failed++
    }
  }

  if (rows.length > 0) {
    creatorSheet.getRange(2, 1, rows.length, 4).setValues(rows)
  }

  SpreadsheetApp.getUi().alert('Done! Saved ' + rows.length + ' creator photos. ' + failed + ' not found.')
}

function resetChannelProgress() {
  var props = PropertiesService.getScriptProperties()
  for (var c = 0; c < FULL_CHANNELS.length; c++) {
    props.deleteProperty('token_' + FULL_CHANNELS[c].channelId)
  }
  SpreadsheetApp.getUi().alert('Progress reset. Next scrapeChannels run starts from the beginning.')
}

function getVideoContent(videoId) {
  // Try captions first
  try {
    var listUrl = 'https://www.youtube.com/api/timedtext?v=' + videoId + '&type=list'
    var listResp = UrlFetchApp.fetch(listUrl, { muteHttpExceptions: true })
    if (listResp.getResponseCode() === 200) {
      var listXml = listResp.getContentText()
      if (listXml && listXml.indexOf('<track') !== -1) {
        var langMatch = listXml.match(/lang_code="([^"]+)"/)
        if (langMatch) {
          var captionUrl = 'https://www.youtube.com/api/timedtext?v=' + videoId + '&lang=' + langMatch[1] + '&fmt=json3'
          var capResp = UrlFetchApp.fetch(captionUrl, { muteHttpExceptions: true })
          if (capResp.getResponseCode() === 200) {
            var capData = JSON.parse(capResp.getContentText())
            if (capData.events) {
              var captionText = capData.events
                .filter(function(e) { return e.segs })
                .map(function(e) { return e.segs.map(function(s) { return s.utf8 }).join('') })
                .join(' ').replace(/\s+/g, ' ').trim()
              if (captionText.length > 100) return captionText
            }
          }
        }
      }
    }
  } catch(e) {
    Logger.log('Caption error for ' + videoId + ': ' + e)
  }

  // Fall back to video description
  var apiKey = PropertiesService.getScriptProperties().getProperty('YOUTUBE_API_KEY')
  if (!apiKey) return null
  try {
    var descUrl = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + videoId + '&key=' + apiKey
    var descResp = UrlFetchApp.fetch(descUrl, { muteHttpExceptions: true })
    if (descResp.getResponseCode() !== 200) return null
    var descData = JSON.parse(descResp.getContentText())
    if (!descData.items || !descData.items[0]) return null
    var desc = (descData.items[0].snippet.description || '').trim()
    if (desc.length > 50) {
      Logger.log('Using description for ' + videoId + ' (' + desc.length + ' chars)')
      return desc
    }
  } catch(e) {
    Logger.log('Description error for ' + videoId + ': ' + e)
  }

  return null
}

function extractRecipeWithClaude(content, title) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY')
  if (!apiKey) return null
  try {
    var prompt = 'You are a recipe extraction assistant. Extract the recipe from this YouTube video content (may be a transcript or video description).\n\nVideo title: ' + title + '\n\nContent:\n' + content.substring(0, 3000) + '\n\nReturn ONLY a JSON object with this exact structure (no markdown, no extra text):\n{"ingredients":["item 1","item 2"],"steps":["step 1","step 2"],"servings":"4","time":"30 minutes"}\n\nIf no clear recipe is found, return: {"error":"no recipe"}'
    var response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      muteHttpExceptions: true,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    if (response.getResponseCode() !== 200) {
      Logger.log('Claude API error: ' + response.getContentText())
      return null
    }
    var result = JSON.parse(response.getContentText())
    var text = result.content && result.content[0] && result.content[0].text
    if (!text) { Logger.log('Claude returned no text'); return null }
    Logger.log('Claude raw: ' + text.substring(0, 300))
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    var recipe = JSON.parse(text)
    if (recipe.error) { Logger.log('Claude: no recipe found'); return null }
    return JSON.stringify(recipe)
  } catch(e) {
    Logger.log('Claude error: ' + e)
    return null
  }
}

function scrapeRecipesTest() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)
  var lastRow = sheet.getLastRow()
  var lastCol = sheet.getLastColumn()
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]

  var recipeCol = headers.indexOf('Recipe') + 1
  if (recipeCol === 0) {
    sheet.getRange(1, lastCol + 1).setValue('Recipe')
    recipeCol = lastCol + 1
    headers.push('Recipe')
    lastCol++
  }

  var titleIdx = headers.indexOf('Title')
  var videoIdIdx = headers.indexOf('VideoID')
  var handleIdx = headers.indexOf('Handle')
  var recipeIdx = recipeCol - 1

  // Batch read all rows at once
  var allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues()

  var tested = 0
  var added = 0

  for (var i = 0; i < allData.length && tested < 5; i++) {
    var row = allData[i]
    if (row[handleIdx] !== '@holmescooking') continue

    var videoId = String(row[videoIdIdx] || '').trim()
    var title = String(row[titleIdx] || '').trim()
    if (!videoId) continue

    Logger.log('Testing: ' + title + ' (' + videoId + ')')
    var content = getVideoContent(videoId)
    if (!content) {
      Logger.log('No content for ' + videoId)
      sheet.getRange(i + 2, recipeCol).setValue('NO_CONTENT')
      tested++
      continue
    }
    Logger.log('Content found (' + content.length + ' chars), calling Claude...')
    var recipe = extractRecipeWithClaude(content, title)
    sheet.getRange(i + 2, recipeCol).setValue(recipe || 'NO_RECIPE')
    if (recipe) {
      added++
      Logger.log('Recipe extracted: ' + recipe.substring(0, 100))
    }
    tested++
    Utilities.sleep(300)
  }

  Logger.log('Test done! Tried ' + tested + ' videos, extracted ' + added + ' recipes.')
}

function scrapeRecipes() {
  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY')
  if (!apiKey) {
    SpreadsheetApp.getUi().alert('Missing ANTHROPIC_API_KEY in Script Properties.')
    return
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)
  var lastRow = sheet.getLastRow()
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]

  var recipeCol = headers.indexOf('Recipe') + 1
  if (recipeCol === 0) {
    sheet.getRange(1, headers.length + 1).setValue('Recipe')
    recipeCol = headers.length + 1
  }

  var titleIdx = headers.indexOf('Title')
  var videoIdIdx = headers.indexOf('VideoID')
  var recipeIdx = recipeCol - 1
  var MAX_PER_RUN = 50
  var MAX_RUNTIME_MS = 5 * 60 * 1000 // stop before Apps Script's execution limit; rerun to continue
  var startTime = Date.now()
  var processed = 0
  var added = 0
  var skipped = 0
  var noContent = 0

  // Batch read all rows
  var lastCol = sheet.getLastColumn()
  var allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues()

  for (var i = 0; i < allData.length && processed < MAX_PER_RUN; i++) {
    if (Date.now() - startTime > MAX_RUNTIME_MS) {
      Logger.log('Stopping early to avoid timeout (ran ' + Math.round((Date.now() - startTime) / 1000) + 's).')
      break
    }
    var row = allData[i]
    if (row[recipeIdx]) { skipped++; continue }

    var videoId = String(row[videoIdIdx] || '').trim()
    var title = String(row[titleIdx] || '').trim()
    if (!videoId) continue

    var content = getVideoContent(videoId)
    if (!content) {
      sheet.getRange(i + 2, recipeCol).setValue('NO_CONTENT')
      noContent++
      processed++
      Utilities.sleep(200)
      continue
    }

    var recipe = extractRecipeWithClaude(content, title)
    sheet.getRange(i + 2, recipeCol).setValue(recipe || 'NO_RECIPE')
    if (recipe) added++
    processed++
    Utilities.sleep(300)
  }

  Logger.log('Done in ' + Math.round((Date.now() - startTime) / 1000) + 's! Extracted ' + added + ' recipes. No content: ' + noContent + '. Already done: ' + skipped + '. Run again to continue.')
}
