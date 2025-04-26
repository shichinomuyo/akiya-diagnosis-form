// code.gs
// ここに doGet を追加
function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// doPost は既に別ファイル(doPost.gs)で定義済みなので重複不要
// デバッグログを出すかどうかのフラグ
const DEBUG = false;

/**
 * DEBUG=true のときだけ Logger.log() するラッパー
 */
function debugLog() {
  if (DEBUG) {
    // 引数をそのまま Logger.log に渡す
    Logger.log.apply(Logger, arguments);
  }
}
