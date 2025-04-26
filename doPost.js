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
    // Create document and build content
    const doc = DocumentApp.create('空き家コスト診断レポート_' + new Date().toISOString());
    const body = doc.getBody();
    body.appendParagraph('【空き家コスト診断レポート】');
    // Uncomment and use if address is needed
    // body.appendParagraph('所在地：' + maskAddress(data.address || '入力なし'));
    body.appendParagraph(`土地面積：${data.land}㎡`);
    body.appendParagraph(`固定資産税 現在：¥${landTaxNow.toLocaleString()}`);
    body.appendParagraph(`特定空家指定後：¥${landTaxAfter.toLocaleString()} (×6)`);
    body.appendParagraph(`３年間の想定総コスト：¥${totalCost3y.toLocaleString()}`);

    doc.saveAndClose();  // Ensure content is saved

    // Move intermediate doc to target folder and remove from root
    const docFile = DriveApp.getFileById(doc.getId());
    const folder  = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    folder.addFile(docFile);
    DriveApp.getRootFolder().removeFile(docFile);

    // Fetch as PDF from the moved document
    const pdfBlob = docFile.getAs(MimeType.PDF)
      .setName('診断結果_' + new Date().toISOString() + '.pdf');
    const file = folder.createFile(pdfBlob);
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