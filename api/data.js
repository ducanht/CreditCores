/**
 * VERCEL SERVERLESS FUNCTION PROXY CHO CREDITCORES
 * Chống lỗi CORS, che giấu Google Script URL và hỗ trợ caching + rate-limiting
 */

const DEFAULT_REAL_GAS_URL = 'https://script.google.com/macros/s/AKfycbxLQHAgdH2cus1zX_z28b31qixMWqq5K0fgIsdy4QFD6xsjRlUyRrwmRyKU28jljAc2/exec';
const GAS_URL = process.env.VITE_GAS_API_URL || process.env.GAS_API_URL || DEFAULT_REAL_GAS_URL;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Cache Control for Vercel Edge CDN (Cache GET requests for 15s)
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=45');
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let targetUrl = GAS_URL;
    let fetchOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (req.method === 'GET') {
      const queryParams = new URLSearchParams(req.query).toString();
      targetUrl = queryParams ? `${GAS_URL}?${queryParams}` : GAS_URL;
      fetchOptions.method = 'GET';
    } else if (req.method === 'POST') {
      fetchOptions.method = 'POST';
      fetchOptions.body = JSON.stringify(req.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s fast timeout
    fetchOptions.signal = controller.signal;

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(502).json({
      status: 'error',
      message: 'Proxy Error to Google Apps Script: ' + error.message,
      fallbackRequired: true
    });
  }
}
