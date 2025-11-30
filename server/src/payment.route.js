// src/payment.route.js
const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');

// API tạo link thanh toán
router.post('/create-link', paymentController.createPaymentLink);

// API nhận webhook từ PayOS
router.post('/webhook', paymentController.receiveWebhook);

// Thêm GET handler để PayOS xác thực webhook
router.get('/webhook', (req, res) => {
  console.log('Received validation GET request from PayOS on /webhook.');
  res.status(200).send('Webhook URL verified.');
});

// API kiểm tra trạng thái đơn hàng
router.get('/order/:orderCode', paymentController.getOrder);

module.exports = router;
