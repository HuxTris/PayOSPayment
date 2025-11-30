// src/payment.route.js
const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');

// API tạo link thanh toán
router.post('/create-link', paymentController.createPaymentLink);

// API nhận webhook từ PayOS
router.post('/webhook', paymentController.receiveWebhook);

// API kiểm tra trạng thái đơn hàng
router.get('/order/:orderCode', paymentController.getOrder);

module.exports = router;
