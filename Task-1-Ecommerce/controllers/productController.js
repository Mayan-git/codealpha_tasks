const mongoose = require('mongoose');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category } = req.query;

  const filter = {};
  if (keyword) {
    filter.name = { $regex: keyword, $options: 'i' };
  }
  if (category && category !== 'All') {
    filter.category = category;
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
});

const getProductById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Product not found' });
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json(categories);
});

module.exports = { getProducts, getProductById, getCategories };
