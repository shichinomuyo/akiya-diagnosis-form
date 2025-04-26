// api/diagnose.js

export default async function handler(req, res) {
    // CORS 対応（プリフライトリクエストに応答）
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(204).end();
    }
  
    // 本来の GAS Web アプリ URL
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxnfyVhKJ7hUCMkTcXBv7b62fxJgERgarlLJ71U_d21q7C2W2tXZlZhbRRYyEL_rJjs/exec';
  
    try {
      const apiRes = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      const data = await apiRes.json();
  
      // クライアントに返すときにも CORS ヘッダを付与
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(data);
  
    } catch (err) {
      console.error('Proxy error:', err);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(500).json({ status: 'error', error: err.toString() });
    }
  }
  