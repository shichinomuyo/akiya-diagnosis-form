<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>空き家診断フォーム</title>
  <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
</head>
<body>
  <h3>空き家コスト診断フォーム</h3>

  <form id="akiyafrm">
    <label>土地面積（㎡）<input type="number" id="land" required></label><br>
    <label>現在の固定資産税（任意）<input type="number" id="tax"></label><br>
    <label>建物床面積（㎡）<input type="number" id="floor" required></label><br>
    <label>管理コスト（円/年）<input type="number" id="cost" required></label><br>
    <label>売却予想価格（任意）<input type="number" id="sale"></label><br>
    <button type="button" id="submitBtn">送信する</button>
  </form>

  <script>
    // 本番では false
    const DEBUG = false;
    // 元の alert を保持
    const _alert = window.alert;
    // DEBUG=false のときは alert を抑制
    window.alert = message => { if (DEBUG) _alert(message); };

    const liffId = "2007323943-d6DJ77WO";

    window.onload = async () => {
      try {
        await liff.init({ liffId });
        document.getElementById("submitBtn").addEventListener("click", submitForm);
      } catch (err) {
        console.error("LIFF init failed:", err);
      }
    };

    async function submitForm() {
      // 1) プロファイル取得
      let profile;
      try {
        profile = await liff.getProfile();
      } catch (err) {
        console.error("getProfile failed:", err);
        return;
      }

      // 2) ペイロード組み立て
      const payload = {
        userId: profile.userId,
        land: document.getElementById("land").value,
        tax: document.getElementById("tax").value || "",
        floor: document.getElementById("floor").value,
        cost: document.getElementById("cost").value,
        sale: document.getElementById("sale").value || ""
      };

      // 3) サーバーへ POST
      try {
        await fetch("/api/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        // 送信完了を一度だけユーザーに通知
        _alert("送信が完了しました。閉じます。");
        liff.closeWindow();
      } catch (err) {
        console.error("fetch failed:", err);
        _alert("送信中にエラーが発生しました。");
      }
    }
  </script>
</body>
</html>
