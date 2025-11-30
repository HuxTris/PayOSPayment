const { PayOS } = require("@payos/node");
const { addOrder, findOrder, updateOrderStatus } = require("./order.db");
const { createHmac } = require('crypto');

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

// URL của app, dùng để PayOS điều hướng về sau khi thanh toán
// QUAN TRỌNG: Đây là URL placeholder, bạn cần thay bằng URL của ứng dụng React Native
// hoặc một trang web bạn có thể kiểm soát.
const RETURN_URL = "https://your-domain.com/return";
const CANCEL_URL = "https://your-domain.com/cancel";


// --- START: Manual Webhook Verification Logic from Docs ---
function sortObjDataByKey(object) {
  const orderedObject = Object.keys(object)
    .sort()
    .reduce((obj, key) => {
      obj[key] = object[key];
      return obj;
    }, {});
  return orderedObject;
}

function convertObjToQueryStr(object) {
  return Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .map((key) => {
      let value = object[key];
      if (value && Array.isArray(value)) {
        value = JSON.stringify(value.map((val) => sortObjDataByKey(val)));
      }
      if ([null, undefined, 'undefined', 'null'].includes(value)) {
        value = '';
      }
      return `${key}=${value}`;
    })
    .join('&');
}

function isValidSignature(data, signature, checksumKey) {
  const sortedDataByKey = sortObjDataByKey(data);
  const dataQueryStr = convertObjToQueryStr(sortedDataByKey);
  const generatedSignature = createHmac('sha256', checksumKey).update(dataQueryStr).digest('hex');
  return generatedSignature === signature;
}
// --- END: Manual Webhook Verification Logic ---


class PaymentController {
  async createPaymentLink(req, res) {
    const { productName, amount } = req.body;
    if (!productName || !amount) {
      return res
        .status(400)
        .json({ error: "productName and amount are required" });
    }

    const orderCode = parseInt(String(Date.now()).slice(-6));

    const order = {
      orderCode,
      amount,
      description: `Thanh toan don hang ${productName}`.substring(0, 25),
      returnUrl: RETURN_URL,
      cancelUrl: CANCEL_URL,
    };

    try {
      const paymentLink = await payos.paymentRequests.create(order);

      // Lưu đơn hàng vào "DB" với trạng thái PENDING
      addOrder({ ...order, status: "PENDING" });

      return res.json({
        checkoutUrl: paymentLink.checkoutUrl,
        orderCode: order.orderCode,
      });
    } catch (error) {
      console.error("Error creating payment link:", error);
      return res.status(500).json({ error: "Failed to create payment link" });
    }
  }

  async receiveWebhook(req, res) {
    const { data, signature } = req.body;
    
    // Check if data and signature exist
    if (!data || !signature) {
        console.error("Webhook error: Missing data or signature.");
        return res.status(400).json({
            error: -1,
            message: "Missing data or signature",
            data: null,
        });
    }

    try {
      // Step 1: Verify the signature
      const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
      const isSignatureValid = isValidSignature(data, signature, checksumKey);

      if (!isSignatureValid) {
        console.error("Webhook verification failed: Invalid signature.");
        return res.status(400).json({
            error: -1,
            message: "Webhook verification failed: Invalid signature",
            data: null,
        });
      }

      console.log("Webhook received and signature verified successfully!");
      console.log("Webhook Data:", data);

      // Step 2: Process the verified data
      const { code, orderCode } = data;

      if (code === "00") {
        // Giao dịch thành công
        updateOrderStatus(orderCode, "PAID");
        const { amount, description, transactionDateTime } = data;
        console.log(`Payment success for order ${orderCode}:`);
        console.log(`  Amount: ${amount}`);
        console.log(`  Description: ${description}`);
        console.log(`  Transaction Time: ${transactionDateTime}`);
      } else {
        // Giao dịch thất bại hoặc bị hủy
        updateOrderStatus(orderCode, "FAILED");
        console.log(`Payment failed or cancelled for order ${orderCode}`);
      }

      // Step 3: Respond to PayOS
      return res.status(200).json({
        error: 0,
        message: "Success",
        data: null,
      });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return res.status(500).json({
        error: -1,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  async getOrder(req, res) {
    const { orderCode } = req.params;
    const order = findOrder(parseInt(orderCode));
    if (order) {
      return res.json(order);
    }
    return res.status(404).json({ error: "Order not found" });
  }
}

module.exports = new PaymentController();
