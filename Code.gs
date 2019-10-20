// https://developers.facebook.com/docs/live-video-api/getting-started/
// https://developers.facebook.com/docs/live-video-api/guides/scheduling
// https://developers.facebook.com/docs/graph-api/reference/live-video/

var CLIENT_ID = '';
var CLIENT_SECRET = '';

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Livestream').addItem('Schedule Livestream', 'scheduleLivestream').addToUi();
}

// this was edited from  run()  in facebook_oauth.gs https://github.com/gsuitedevs/apps-script-oauth2/blob/master/samples/Facebook.gs
function scheduleLivestream() {
  var service = getService();
  if (service.hasAccess()) {
    var page = 'me';
    var newDate = generateDate();
    var planned_start_time = String(newDate.getTime() / 1000); // convert from miliseconds to seconds since epoch
    var title = generateTitle(newDate);
    var status = 'SCHEDULED_UNPUBLISHED'; // UNPUBLISHED, LIVE_NOW, SCHEDULED_UNPUBLISHED, SCHEDULED_LIVE, SCHEDULED_CANCELED    
    var url = 'https://graph.facebook.com/v4.0/'+page+'/live_videos?status='+status+'&planned_start_time='+planned_start_time+'&title='+title;
    var response = UrlFetchApp.fetch(url, {'method': 'post', headers: {'Authorization': 'Bearer ' + service.getAccessToken()}});
    var result = JSON.parse(response.getContentText());
    //Logger.log(service.getAccessToken());
    //Logger.log(response);
    var id = result.id;
    var stream_url = result.stream_url;
    Logger.log(id);
    Logger.log(stream_url);
    writeToSpreadsheet(newDate, title, id, stream_url);
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
  }
}

// Configures the service.
function getService() {
  return OAuth2.createService('Facebook')
    // Set the endpoint URLs.
    .setAuthorizationBaseUrl('https://www.facebook.com/dialog/oauth')
    .setTokenUrl('https://graph.facebook.com/v4.0/oauth/access_token')

    // Set the client ID and secret.
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)

    // Set the name of the callback function that should be invoked to complete
    // the OAuth flow.
    .setCallbackFunction('authCallback')

    // Set the property store where authorized tokens should be persisted.
    .setPropertyStore(PropertiesService.getUserProperties());
}

// Handles the OAuth callback
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

function generateDate() {
  var dateNow = new Date();
  var year = dateNow.getFullYear();
  var month = dateNow.getMonth();
  var day = dateNow.getDate() + ((7 - dateNow.getDay()) % 7); // next Sunday, idea from https://stackoverflow.com/questions/33078406/getting-the-date-of-next-monday
  var newDate = new Date(year, month, day, 10, 30); // 10:30 am, use 24 hour time
  return newDate;
}

function generateTitle(newDate) {
  var year = newDate.getFullYear();
  var month = newDate.getMonth();
  var day = newDate.getDate();
  var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];  // https://www.w3schools.com/js/js_date_methods.asp
  var title = 'Live Video ' + months[newDate.getMonth()] + ' ' + day + ', ' + year;
  //Logger.log(newDate);
  return title;
}

function writeToSpreadsheet(newDate, title, id, stream_url) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var lastRow = sheet.getLastRow();
  var scheduledDate = newDate.toISOString().split('T')[0];
  sheet.getRange(lastRow+1, 1, 1, 4).setValues([[scheduledDate, title, id, stream_url]]); // rows, columns, numRows, numColumns
}

// Reset the authorization state, so that it can be re-tested.
function reset() {
  getService().reset();
}