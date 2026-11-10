const express = require('express');
const path = require('path');
const { PORT } = require('./config');
const api = require('./src/routes/api');

const app = express();
app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', api);
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

app.listen(PORT, () => {
  console.log(`Shop  : http://localhost:${PORT}`);
  console.log(`Admin : http://localhost:${PORT}/admin`);
});
