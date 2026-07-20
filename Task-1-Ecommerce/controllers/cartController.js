const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const getCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await cart.populate('items.product');
  }
  return cart;
};

const formatCart = (cart) => {
  const items = cart.items
    .filter((item) => item.product)
    .map((item) => ({
      product: item.product,
      quantity: item.quantity,
      subtotal: Number((item.product.price * item.quantity).toFixed(2)),
    }));
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = Number(items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2));
  return { _id: cart._id, items, totalItems, totalAmount };
};

const getMyCart = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  res.json(formatCart(cart));
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId || !mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: 'A valid productId is required' });
  }
  if (quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  const desiredQuantity = (existingItem ? existingItem.quantity : 0) + Number(quantity);

  if (desiredQuantity > product.stock) {
    return res.status(400).json({ message: `Only ${product.stock} units of ${product.name} available` });
  }

  if (existingItem) {
    existingItem.quantity = desiredQuantity;
  } else {
    cart.items.push({ product: productId, quantity: Number(quantity) });
  }

  await cart.save();
  await cart.populate('items.product');
  res.status(201).json(formatCart(cart));
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid product id' });
  }
  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1' });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    return res.status(404).json({ message: 'Item not found in cart' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  if (quantity > product.stock) {
    return res.status(400).json({ message: `Only ${product.stock} units of ${product.name} available` });
  }

  item.quantity = Number(quantity);
  await cart.save();
  await cart.populate('items.product');
  res.json(formatCart(cart));
});

const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();
  await cart.populate('items.product');
  res.json(formatCart(cart));
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ _id: cart ? cart._id : null, items: [], totalItems: 0, totalAmount: 0 });
});

module.exports = { getMyCart, addToCart, updateCartItem, removeCartItem, clearCart, getCart, formatCart };
