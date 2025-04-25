function doPost(e) {
  Logger.log("=== doPost START ===");

  try {
    Logger.log("e: " + JSON.stringify(e));
    Logger.log("postData: " + e.postData?.contents);

    const data = JSON.parse(e.postData.contents);
    Logger.log("Parsed: " + JSON.stringify(data));

    const sheet = SpreadsheetApp.openById("1P-4GO7poP9pr8NOTPdU9idvj2FFtl9uDtHDls1iDmkU").getSheetByName("sheet1");
    sheet.appendRow([
      new Date(),
      data.userId,
      data.land,
      data.tax,
      data.floor,
      data.cost,
      data.sale
    ]);

    Logger.log("✅ appendRow 成功");

    return ContentService.createTextOutput(JSON.stringify({
      status: "ok",
      pdfUrl: "https://example.com/dummy.pdf"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("❌ Error: " + err);
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
