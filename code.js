// code.gs
// ここに doGet を追加
function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// doPost は既に別ファイル(doPost.gs)で定義済みなので重複不要
