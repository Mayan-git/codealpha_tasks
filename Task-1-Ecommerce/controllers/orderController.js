const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address ||
      !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
    return res.status(400).json({ message: 'Complete shipping address is required' });
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty' });
  }

  for (const item of cart.items) {
    if (!item.product) {
      return res.status(400).json({ message: 'One of the items in your cart no longer exists' });
    }
    if (item.quantity > item.product.stock) {
      return res.status(400).json({ message: `Only ${item.product.stock} units of ${item.product.name} available` });
    }
  }

  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    image: item.product.image,
    price: item.product.price,
    quantity: item.quantity,
  }));

  const totalAmount = Number(
    orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)
  );

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'Cash on Delivery',
    totalAmount,
  });

  await Promise.all(
    cart.items.map((item) =>
      Product.updateOne({ _id: item.product._id }, { $inc: { stock: -item.quantity } })
    )
  );

  cart.items = [];
  await cart.save();

  res.status(201).json(order);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

const getOrderById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Order not found' });
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Not authorized to view this order' });
  }
  res.json(order);
});

module.exports = { createOrder, getMyOrders, getOrderById };
