/**
 * Main POST handler for LINE LIFF form submissions.
 */
function doPost(e) {
  debugLog("=== doPost START ===");

  try {
    debugLog("e: " + JSON.stringify(e));
    debugLog("postData: " + e.postData?.contents);

    const data = JSON.parse(e.postData.contents);
    debugLog("Parsed: " + JSON.stringify(data));

    // 1) スプレッドシートに書き込み
    const sheet = SpreadsheetApp
      .openById("1P-4GO7poP9pr8NOTPdU9idvj2FFtl9uDtHDls1iDmkU")
      .getSheetByName("sheet1");
    sheet.appendRow([
      new Date(),
      data.userId,
      data.land,
      data.tax,
      data.floor,
      data.cost,
      data.sale
    ]);
    debugLog("✅ appendRow 成功");

    // 2) PDF URL を生成
    // PDF 生成
    let pdfUrl;
    try {
      pdfUrl = generatePdfUrl(data);
      debugLog("✅ PDF URL generated: " + pdfUrl);
    } catch (pdfErr) {
      debugLog("❌ PDF generation error: " + pdfErr.stack);
      // ここでエラーを返す
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "pdf_error",
          error: pdfErr.toString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 成功レスポンス
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "ok",
        pdfUrl: pdfUrl
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    debugLog("❌ Error: " + err.stack);
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        error: err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * HTMLテンプレートからPDFを生成しDriveに保存、共有URLを返す
 */
function generatePdfUrl(data) {
  // テンプレートを取得・データバインド
  const tpl = HtmlService.createTemplateFromFile('pdfTemplate');
  tpl.data = data;
  const html = tpl.evaluate().getContent();

  // HTML -> PDF
  const blob = Utilities.newBlob(html, 'text/html', '診断結果.html')
    .getAs(MimeType.PDF)
    .setName(`診断結果_${new Date().toISOString()}.pdf`);

  // Driveに保存
  const folder = DriveApp.getFolderById('1iI4HtvwfSL-HXy5Sfe42ypz57Ob73tu6');
  const file = folder.createFile(blob);

  // 共有設定
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}
