// src/app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Nạp biến môi trường ngay tại đây
require('dotenv').config();

// In ra để kiểm tra ngay khi khởi động
console.log('[APP START] PAYOS_CLIENT_ID:', process.env.PAYOS_CLIENT_ID);

const paymentRoutes = require('./payment.route');

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/payment', paymentRoutes);

app.get('/', (req, res) => {
  res.send('Backend server for PayOS Demo is running!');
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
