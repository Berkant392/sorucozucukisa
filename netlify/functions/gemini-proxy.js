// netlify/functions/gemini-proxy.js
// Bu dosya, Gemini API çağrılarını güvenli bir şekilde Netlify Functions üzerinden yönlendirmek için kullanılır.

exports.handler = async (event, context) => {
    // Sadece POST isteklerini kabul et
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
            headers: { 'Allow': 'POST' }
        };
    }

    // Netlify ortam değişkenlerinden Gemini API anahtarını al
    // Bu anahtar, Netlify UI'ında veya netlify.toml dosyasında (ancak bu senaryoda UI tercih edilir) tanımlanmalıdır.
    // Örneğin: GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY ortam değişkeni tanımlı değil.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: Gemini API Key is missing.' })
        };
    }

    try {
        // İstemciden gelen isteğin gövdesini ayrıştır
        const requestBody = JSON.parse(event.body);

        // Gemini API URL'i
        // Modeli değiştirmek isterseniz buradan güncelleyebilirsiniz.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        // Gemini API'ye isteği ilet
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody) // İstemciden gelen payload'ı doğrudan ilet
        });

        // API yanıtını kontrol et
        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Gemini API Hatası:", errorBody);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Gemini API responded with status ${response.status}`, details: errorBody })
            };
        }

        // API'den gelen yanıtı istemciye geri gönder
        const data = await response.json();
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Proxy fonksiyonunda hata oluştu:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
