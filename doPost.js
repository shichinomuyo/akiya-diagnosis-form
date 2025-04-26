/**
 * Configuration constants
 */
const SPREADSHEET_ID      = "1P-4GO7poP9pr8NOTPdU9idvj2FFtl9uDtHDls1iDmkU";
const SHEET_NAME          = "sheet1";
const DRIVE_FOLDER_ID     = "1iI4HtvwfSL-HXy5Sfe42ypz57Ob73tu6";
const LINE_CHANNEL_TOKEN  = "YOUR_CHANNEL_ACCESS_TOKEN";
const LINE_PUSH_API_URL   = "https://api.line.me/v2/bot/message/push";

/**
 * Helper to log only when DEBUG is true
 */
function debugLog() {
  if (typeof DEBUG !== 'undefined' && DEBUG) {
    Logger.log.apply(Logger, arguments);
  }
}

/**
 * Flatten and send JSON response
 */
function buildResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Calculate default tax rate if not provided
 */
function calcTax(land) {
  // Example: ㎡あたり100円
  return Number(land) * 100;
}

/**
 * Mask address beyond first 3 chars
 */
function maskAddress(address) {
  return address.replace(/(.{3}).+/, '$1***');
}

/**
 * Main entry point for POST requests
 */
function doPost(e) {
  debugLog("=== doPost START ===");

  let data;
  try {
    data = JSON.parse(e.postData.contents);
    debugLog("Parsed data:", data);
  } catch (err) {
    debugLog("❌ JSON parse error:", err);
    return buildResponse({ status: 'error', error: 'Invalid payload' });
  }

  // 1) Append to Spreadsheet
  try {
    const sheet = SpreadsheetApp
      .openById(SPREADSHEET_ID)
      .getSheetByName(SHEET_NAME);
    sheet.appendRow([
      new Date(),
      data.userId,
      data.land,
      data.tax,
      data.floor,
      data.cost,
      data.sale
    ]);
    debugLog("✅ Spreadsheet append success");
  } catch (err) {
    debugLog("❌ Spreadsheet error:", err);
    return buildResponse({ status: 'error', error: 'Spreadsheet write failed' });
  }

  // 2) Compute costs
  const landTaxNow   = data.tax ? Number(data.tax) : calcTax(data.land);
  const landTaxAfter = landTaxNow * 6;
  const totalCost3y  = landTaxAfter * 3 + Number(data.cost) * 3;
  debugLog(`Computed taxes: now=${landTaxNow}, after=${landTaxAfter}, total3y=${totalCost3y}`);

  // 3) Generate PDF report via DocumentApp
  let pdfUrl;
  try {
    const doc = DocumentApp.create('空き家コスト診断レポート_' + new Date().toISOString());
    const body = doc.getBody();
    body.appendParagraph('【空き家コスト診断レポート】');
    body.appendParagraph('所在地：' + maskAddress(data.address || '入力なし'));
    body.appendParagraph(`土地面積：${data.land}㎡`);
    body.appendParagraph(`固定資産税 現在：¥${landTaxNow.toLocaleString()}`);
    body.appendParagraph(`特定空家指定後：¥${landTaxAfter.toLocaleString()} (×6)`);
    body.appendParagraph(`３年間の想定総コスト：¥${totalCost3y.toLocaleString()}`);

    const pdfBlob = doc.getAs(MimeType.PDF).setName('診断結果.pdf');
    const folder  = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const file    = folder.createFile(pdfBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    pdfUrl = file.getUrl();
    debugLog("✅ PDF created at:", pdfUrl);
  } catch (err) {
    debugLog("❌ PDF generation error:", err);
    return buildResponse({ status: 'pdf_error', error: err.toString() });
  }

  // 4) Push message via Messaging API
  try {
    const payload = {
      to: data.userId,
      messages: [{
        type: 'text',
        text: `診断PDFが出来上がりました！\n▼ダウンロード\n${pdfUrl}`
      }]
    };
    UrlFetchApp.fetch(LINE_PUSH_API_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + LINE_CHANNEL_TOKEN },
      payload: JSON.stringify(payload)
    });
    debugLog("✅ LINE message push success");
  } catch (err) {
    debugLog("❌ LINE push error:", err);
    // Continue even if push fails
  }

  // 5) Return response to LIFF client
  return buildResponse({ status: 'ok', pdfUrl });
}

<!-- pdfTemplate.html -->
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; padding: 20px; }
    h1 { font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    td { padding: 4px; border: 1px solid #ccc; }
  </style>
</head>
<body>
  <h1>空き家コスト診断結果レポート</h1>
  <table>
    <tr><td>所在地</td><td><?= maskAddress(data.address || '入力なし') ?></td></tr>
    <tr><td>土地面積（㎡）</td><td><?= data.land ?></td></tr>
    <tr><td>固定資産税（現在円）</td><td><?= landTaxNow.toLocaleString() ?></td></tr>
    <tr><td>固定資産税（特定空家後円）</td><td><?= landTaxAfter.toLocaleString() ?></td></tr>
    <tr><td>３年間の想定総コスト（円）</td><td><?= totalCost3y.toLocaleString() ?></td></tr>
  </table>
</body>
</html>
