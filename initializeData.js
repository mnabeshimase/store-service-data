const faker = require('faker');
const mysql = require('promise-mysql');
const mysqlConfig = require('./mysql.config.js');

const CATEGORIES = [
  'Automotive & Powersports',
  'Beauty',
  'Clothing & Accessories',
  'Collectible Books',
  'Collectible Coins',
  'Entertainment Collectibles',
  'Fine Art',
  'Gift Cards',
  'Grocery & Gourmet Foods',
  'Health & Personal Care',
  'Independent Design',
  'Jewelry',
  'Luggage & Travel Accessories',
  'Major Appliances',
  'Services',
  'Sexual Wellness',
  'Shoes',
  'Handbags & Sunglasses',
  'Sports Collectibles',
  'Textbook Rentals',
  'Video, DVD, & Blu-ray',
  'Watches',
  'Wine',
];
const USERS_TOTAL = 1000;
const PRODUCTS_TOTAL = 1000;
const PRUCHASES_TOTAL = 1000;
let connection;

const insertUser = () => (
  connection.query('INSERT INTO users SET ?', {
    age: Math.floor(Math.random() * 120),
    email: faker.internet.email(), // Currently there is no email varification
    password: faker.internet.password(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    // Faker creates inconsisitencies in address, zip, city, and state
    street_address: faker.address.streetAddress(),
    zip_code: faker.address.zipCode(),
    city: faker.address.city(),
    state: faker.address.state(),
    gender: Math.random() >= 0.5 ? 'male' : 'female',
    marital_status: Math.random() >= 0.5 ? 'single' : 'married',
    children: Math.floor(Math.random() * 5),
  })
);

const insertProduct = () => (
  connection.query('INSERT INTO products SET ?', {
    name: faker.commerce.productName(),
    price: (Math.floor(Math.random() * 10000) + 1),
    user_id: Math.floor(Math.random() * USERS_TOTAL) + 1,
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
  })
);

const insertReview = (userId, productId, purchaseId) => (
  connection.query('INSERT INTO reviews SET ?', {
    user_id: userId,
    product_id: productId,
    purchase_id: purchaseId,
    title: faker.lorem.sentence(),
    review: faker.lorem.paragraphs(),
    rating: Math.floor(Math.random() * 5) + 1,
  })
);

const insertShoppingCart = (userId, subtotal) => (
  connection.query('INSERT INTO shopping_carts SET ?', {
    user_id: userId,
    subtotal,
  })
);

const insertProductShoppingCart = (productId, shoppingCartId, quantity) => (
  connection.query('INSERT INTO products_shopping_carts SET ?', {
    product_id: productId,
    shopping_cart_id: shoppingCartId,
    quantity,
  })
);

const insertPurchase = (userId, shoppingCartId) => (
  connection.query('INSERT INTO purchases SET ?', {
    user_id: userId,
    shopping_cart_id: shoppingCartId,
  })
);

const makePurchase = async () => {
  const userId = Math.floor(Math.random() * USERS_TOTAL) + 1;
  const products = [];
  const numItems = Math.floor(Math.random() * 20) + 1;
  let subtotal = 0;
  for (let j = 0; j < numItems; j += 1) {
    const productsInPurchase = new Set();
    let newProductId;
    do {
      newProductId = Math.floor(Math.random() * PRODUCTS_TOTAL) + 1;
    } while (productsInPurchase.has(newProductId));
    productsInPurchase.add(newProductId);
    const product = {
      id: newProductId,
      price: (Math.floor(Math.random() * 10000) + 1), // Inconsistency with products table
      quantity: Math.floor(Math.random() * 20) + 1,
      rating: Math.floor(Math.random() * 5) + 1,
      review_title: faker.lorem.sentence(),
      review_body: faker.lorem.paragraphs(),
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    };
    products.push(product);
    subtotal += product.price * product.quantity;
    product.price /= 100;
  }
  const shoppingCartId = (await insertShoppingCart(userId, subtotal)).insertId;
  const purchaseId = (await insertPurchase(userId, shoppingCartId)).insertId;
  for (let i = 0; i < numItems; i += 1) {
    await insertReview(userId, products[i].id, purchaseId);
    await insertProductShoppingCart(products[i].id, shoppingCartId, products[i].quantity);
  }
};

const initialize = async () => {
  connection = await mysql.createConnection(mysqlConfig);
  for (let i = 0; i < USERS_TOTAL; i += 1) {
    await insertUser();
  }
  for (let i = 0; i < PRODUCTS_TOTAL; i += 1) {
    await insertProduct();
  }
  for (let i = 0; i < PRUCHASES_TOTAL; i += 1) {
    await makePurchase();
  }
  return 0;
};

initialize()
  .then(() => connection.end());

module.exports.categories = CATEGORIES;
module.exports.usersTotal = USERS_TOTAL;
module.exports.productsTotal = PRODUCTS_TOTAL;
module.exports.purchasesTotal = PRUCHASES_TOTAL;
