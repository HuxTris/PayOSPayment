// src/payment.controller.js
require('dotenv').config();
const PayOS = require('@payos/node');
const { addOrder, findOrder, updateOrderStatus } = require('./order.db');

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

// URL của app, dùng để PayOS điều hướng về sau khi thanh toán
// QUAN TRỌNG: Đây là URL placeholder, bạn cần thay bằng URL của ứng dụng React Native
// hoặc một trang web bạn có thể kiểm soát.
const RETURN_URL = 'https://your-domain.com/return'; 
const CANCEL_URL = 'https://your-domain.com/cancel';

class PaymentController {
  async createPaymentLink(req, res) {
    const { productName, amount } = req.body;
    if (!productName || !amount) {
      return res.status(400).json({ error: 'productName and amount are required' });
    }

    const orderCode = parseInt(String(Date.now()).slice(-6));

    const order = {
      orderCode,
      amount,
      description: `Thanh toan don hang ${productName}`,
      returnUrl: RETURN_URL,
      cancelUrl: CANCEL_URL,
    };

    try {
      const paymentLink = await payos.createPaymentLink(order);

      // Lưu đơn hàng vào "DB" với trạng thái PENDING
      addOrder({ ...order, status: 'PENDING' });

      return res.json({
        checkoutUrl: paymentLink.checkoutUrl,
        orderCode: order.orderCode,
      });
    } catch (error) {
      console.error('Error creating payment link:', error);
      return res.status(500).json({ error: 'Failed to create payment link' });
    }
  }

  async receiveWebhook(req, res) {
    const webhookData = req.body;
    try {
      // Xác thực webhook
      const verifiedData = payos.verifyPaymentWebhookData(webhookData);
      
      console.log('Webhook received and verified:', verifiedData);

      if (verifiedData.code === '00') {
        // Giao dịch thành công
        const orderCode = verifiedData.orderCode;
        updateOrderStatus(orderCode, 'PAID');
        console.log(`Payment success for order ${orderCode}`);
      } else {
        // Giao dịch thất bại hoặc bị hủy
        const orderCode = verifiedData.orderCode;
        updateOrderStatus(orderCode, 'FAILED');
        console.log(`Payment failed or cancelled for order ${orderCode}`);
      }

      // Phản hồi cho PayOS biết đã nhận được webhook
      return res.status(200).json({
        "error": 0,
        "message": "Success",
        "data": null
      });

    } catch (error) {
      console.error('Webhook verification failed:', error);
      return res.status(400).json({
        "error": -1,
        "message": "Webhook verification failed",
        "data": null
      });
    }
  }
  
  async getOrder(req, res) {
    const { orderCode } = req.params;
    const order = findOrder(parseInt(orderCode));
    if (order) {
      return res.json(order);
    }
    return res.status(404).json({ error: 'Order not found' });
  }
}

module.exports = new PaymentController();
