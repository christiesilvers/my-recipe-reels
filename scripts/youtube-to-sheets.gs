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
]

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 8).setValues([['Title', 'Creator', 'Handle', 'Cuisine', 'ReelURL', 'Views', 'HasAIRecipe', 'VideoID']])
  }
  return sheet
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

function scrapeChannels() {
  var sheet = getSheet()
  var existingIds = getExistingIds(sheet)
  var props = PropertiesService.getScriptProperties()
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
    }
  }

  var msg = 'Done! Added ' + totalAdded + ' reels. Skipped ' + totalSkipped + ' dupes. Total: ' + (sheet.getLastRow() - 1)
  Logger.log(msg)
  SpreadsheetApp.getUi().alert(msg)
}

function scrapeSearches() {
  var sheet = getSheet()
  var existingIds = getExistingIds(sheet)
  var rows = []
  var skipped = 0

  for (var s = 0; s < SEARCHES.length; s++) {
    var srch = SEARCHES[s]
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
        existingIds[videoId] = true
      }

      Utilities.sleep(500)
    } catch (err) {
      Logger.log('Error on ' + srch.query + ': ' + err)
    }
  }

  if (rows.length > 0) {
    var lastRow = sheet.getLastRow()
    sheet.getRange(lastRow + 1, 1, rows.length, 8).setValues(rows)
  }

  var msg = 'Done! Added ' + rows.length + ' reels. Skipped ' + skipped + ' dupes. Total: ' + (sheet.getLastRow() - 1)
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
