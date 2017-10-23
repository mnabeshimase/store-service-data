const rp = require('request-promise');
const faker = require('faker');

const DLPORT = 3000;
let USERS_TOTAL = 0;
let PRODUCTS_TOTAL = 0;

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

const mouseovers = () => {
  const jar = rp.jar();
  const cookieValue = Array(32).fill(0).map(() => faker.random.alphaNumeric()).join('');
  jar.setCookie(rp.cookie(`dummyCookie=${cookieValue}`), `http://localhost:${DLPORT}`);
  const allMouseovers = {};
  const mouseoversLength = Math.floor(Math.random() * 5);
  for (let i = 0; i < mouseoversLength; i += 1) {
    allMouseovers[Math.floor(Math.random() * PRODUCTS_TOTAL) + 1] = Math.random() * 100000;
  }
  return rp({
    method: 'POST',
    url: `http://127.0.0.1:${DLPORT}/mouseovers`,
    json: allMouseovers,
    jar,
  });
};

const pageView = () => {
  const jar = rp.jar();
  const cookieValue = Array(32).fill(0).map(() => faker.random.alphaNumeric()).join('');
  jar.setCookie(rp.cookie(`dummyCookie=${cookieValue}`), `http://localhost:${DLPORT}`);
  return rp({
    method: 'GET',
    url: `http://127.0.0.1:${DLPORT}/${Math.floor(Math.random() * PRODUCTS_TOTAL) + 1}`,
    qs: {
      user_id: Math.floor(Math.random() * USERS_TOTAL) + 1,
    },
    json: {
      view_duration: Math.random() * 600,
    },
    jar,
  });
};

const signup = () => {
  USERS_TOTAL += 1;
  return rp({
    method: 'POST',
    url: `http://127.0.0.1:${DLPORT}/signup`,
    json: {
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
    },
  });
};

const purchase = () => {
  const products = [];
  const numItems = Math.floor(Math.random() * 20) + 1;
  let subtotal = 0;
  for (let j = 0; j < numItems; j += 1) {
    const productsInPurchase = new Set();
    let newProductId = Math.floor(Math.random() * PRODUCTS_TOTAL) + 1;
    while (productsInPurchase.has(newProductId)) {
      newProductId = Math.floor(Math.random() * PRODUCTS_TOTAL) + 1;
    }
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
  return rp({
    method: 'POST',
    url: `http://127.0.0.1:${DLPORT}/purchase`,
    json: {
      user_id: Math.floor(Math.random() * USERS_TOTAL) + 1,
      subtotal: subtotal / 100,
      products,
    },
  });
};

const addProduct = () => {
  PRODUCTS_TOTAL += 1;
  return rp({
    method: 'POST',
    url: `http://127.0.0.1:${DLPORT}/products`,
    json: {
      name: faker.commerce.productName(),
      price: (Math.floor(Math.random() * 10000) + 1),
      user_id: Math.floor(Math.random() * USERS_TOTAL) + 1,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    },
  });
};

const initialUsersAndProducts = [];
for (let i = 0; i < 1000; i += 1) {
  initialUsersAndProducts.push(signup());
  initialUsersAndProducts.push(addProduct());
}
Promise.all(initialUsersAndProducts)
  .then(() => {
    setInterval(signup, 50);
    setInterval(addProduct, 100);
    setInterval(pageView, 10);
    setInterval(mouseovers, 10);
    setInterval(purchase, 10);
  });
