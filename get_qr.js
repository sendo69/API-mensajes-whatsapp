const axios = require('axios');
const fs = require('fs');

async function getQr() {
  try {
    // 1. Crear instancia
    await axios.post('http://localhost:8080/instance/create', {
      instanceName: 'mi_numero',
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      browser: ["Ubuntu", "Chrome", "20.0"]
    }, {
      headers: {
        'apikey': 'super_secret_key_123',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Instancia creada. Esperando 5 segundos a que cargue WhatsApp...');
    await new Promise(r => setTimeout(r, 5000));

    // 2. Obtener el QR
    const response = await axios.get('http://localhost:8080/instance/connect/mi_numero', {
      headers: { 'apikey': 'super_secret_key_123' }
    });

    if (response.data && response.data.base64) {
      const base64Data = response.data.base64.replace(/^data:image\/png;base64,/, "");
      const artifactPath = "C:/Users/user/.gemini/antigravity/brain/0fac7be7-160a-4af3-9336-7e4e7e614ef4/qr.png";
      fs.writeFileSync(artifactPath, base64Data, 'base64');
      console.log('QR generado en artefactos.');
    } else {
      console.log('No QR:', response.data);
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

getQr();
