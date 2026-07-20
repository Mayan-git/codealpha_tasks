require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const sampleProducts = require('./products');

const run = async () => {
  await connectDB();

  if (process.argv.includes('-d')) {
    await Product.deleteMany();
    console.log('Products destroyed');
  } else {
    await Product.deleteMany();
    await Product.insertMany(sampleProducts);
    console.log(`${sampleProducts.length} products seeded`);
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
