// server.js (Broker)
const express = require('express');
const WebSocket = require('ws');
const app = express();
const port = 3000;

// HTTP server for static files (e.g., proxy/client HTML)
app.use(express.static('public'));
const server = app.listen(port, () => {
  console.log(`Broker running at http://localhost:${port}`);
});

// WebSocket server for signaling
const wss = new WebSocket.Server({ server });
const proxies = new Set(); // Track available proxies

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'register-proxy') {
      proxies.add(ws); // Add proxy to pool
      console.log('Proxy registered');
    } 
    
    else if (data.type === 'request-proxy') {
      // Assign first available proxy to the client
      if (proxies.size > 0) {
        const [proxy] = proxies;
        proxy.send(JSON.stringify({ type: 'offer', payload: data.offer }));
        console.log('Forwarded client offer to proxy');
      }
    }
    
    else if (data.type === 'answer') {
      // Forward proxy's answer to the client
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'answer', payload: data.answer }));
        }
      });
    }
  });
});