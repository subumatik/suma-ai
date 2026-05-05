const http = require('http');

const req = http.request('http://localhost:3000/api/chat', { 
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' } 
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const match = data.match(/<title>(.*?)<\/title>/);
    console.log('Title:', match ? match[1] : 'No title');
    const msgMatch = data.match(/"message":"([^"]+)"/);
    console.log('Message:', msgMatch ? msgMatch[1] : 'No message found');
    if (!match && !msgMatch) {
      console.log('Body snippet:', data.substring(0, 500));
    }
  });
});
req.write(JSON.stringify({ case_id: 'test', messages: [{ role: 'user', content: 'test' }] }));
req.on('error', e => console.error(e));
req.end();
