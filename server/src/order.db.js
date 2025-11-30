// src/order.db.js

// Sử dụng một object đơn giản để làm DB in-memory
// Key là orderCode, value là thông tin đơn hàng
const orders = {};

const addOrder = (order) => {
  orders[order.orderCode] = order;
};

const findOrder = (orderCode) => {
  return orders[orderCode];
};

const updateOrderStatus = (orderCode, status) => {
  if (orders[orderCode]) {
    orders[orderCode].status = status;
    console.log(`Updated order ${orderCode} to status ${status}`);
  }
};

module.exports = {
  addOrder,
  findOrder,
  updateOrderStatus,
};
