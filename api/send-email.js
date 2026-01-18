// api/send-email.js
export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, owner_name, pet_name, htmlContent } = req.body;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY // 這裡會讀取 Vercel 後台的隱藏金鑰
      },
      body: JSON.stringify({
        sender: { name: "可樂果寵物生活館", email: "no-reply@shibastudio.online" },
        to: [{ email: email, name: owner_name }],
        subject: `【可樂果寵物生活館】寵物美容契約副本 - ${pet_name}`,
        htmlContent: htmlContent
      })
    });

    const result = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return res.status(response.status).json({ success: false, error: result });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
