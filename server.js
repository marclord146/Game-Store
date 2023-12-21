const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const multer = require('multer');
const stripe = require('stripe')('sk_test_51N5HUTKEkL2KQIeIt188zgFJJDb01iqPYtXDkxoHAxYQfTkI7boGpcNXNwQ4X3vvfYJFmR8DGrUgiX9oRJvolwQf003adCkwYi');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const crypto = require('crypto');
const ejs = require('ejs'); 
const secretKey = crypto.randomBytes(32).toString('hex');
console.log(secretKey);


app.use(cookieParser());

app.use(session({
  secret: secretKey, // Change this to a strong secret
  resave: false,
  saveUninitialized: true,
}));

// Set SameSite and Secure attributes for all cookies
app.use((req, res, next) => {
  res.cookie('m', 'cookieValue', {
    sameSite: 'None',
    secure: true, // Set to true if your site is served over HTTPS
  });
  next();
});

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'mysql',
  database: 'gamestore'
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected to database as ID ' + connection.threadId);
});

app.use(bodyParser.json( {limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Serve static files from the public directory
app.use(express.static(path.join(__dirname,)));

// Set up a route to serve the HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'shop.html'));
});

app.get('/sproduct', (req, res) => {
  res.sendFile(path.join(__dirname, 'sproduct.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'cart.html'));
});

app.get('/Ahome', (req, res) => {
  res.sendFile(path.join(__dirname, 'Ahome.html'));
});

app.get('/Aproducts', (req, res) => {
  res.sendFile(path.join(__dirname, 'Aproducts.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'checkout.html'));
});

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'successfulpayment.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});
app.get('/products', (req, res) => {
  const sql = 'SELECT * FROM products';
  connection.query(sql, (err, result) => {
    if (err) throw err;
    res.setHeader('Content-Type', 'application/json');
    res.json(result);
  });
});



app.post('/insert-product', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 }
]), (req, res) => {
  // Extract data from the form submission
  const { productname, brand, category, price, quantity, description } = req.body;

  // Extract file buffers from the request
  const images = [
    req.files['image'][0].buffer,
    req.files['image2'][0].buffer,
    req.files['image3'][0].buffer,
    req.files['image4'][0].buffer
  ];

  // SQL query to insert data into the products table
  const sql = 'INSERT INTO products (Product_Name, Brand, Category, Price, Quantity, Description, Image, Image2, Image3, Image4) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [productname, brand, category, price, quantity, description, ...images];

  // Execute the query
  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into products table: ' + err.stack);
      res.status(500).send('Error inserting data into products table');
      return;
    }

    

    // Redirect to Aproducts.html after successful insertion
    res.redirect('/Aproducts.html');
  });
});

app.get('/products/:productId', (req, res) => {
  const productId = req.params.productId;

  // Use your database queries to fetch the product by ID
  const sql = 'SELECT * FROM products WHERE pID = ?';
  connection.query(sql, [productId], (err, result) => {
      if (err) {
          console.error('Error fetching product: ' + err.stack);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }

      if (result.length === 0) {
          // If the product is not found, return a 404 status
          return res.status(404).json({ error: 'Product not found' });
      }

      // If the product is found, return it in the response
      res.json(result[0]);
  });
});

// Use an in-memory array to store cart items
let cartItems = [];


// Function to load cart items
function loadCartItems() {
  // Implement logic to fetch cart items from your in-memory storage
  return cartItems;
}

app.get('/cart-items', (req, res) => {
  // Fetch and send cart items from the database
  const cartItems = loadCartItems(); // Implement this function
  res.json(cartItems.map(item => ({
    productId: item.productId,
    productName: item.productName,
    productPrice: item.productPrice,
    quantity: item.quantity,
    mainImage: item.mainImage,
    // Add more properties as needed
  })));
});
app.post('/add-to-cart', (req, res) => {
  try {
    const { productId, productName, productPrice, quantity, mainImage } = req.body;

    // Log the received data
    console.log('Received data:', { productId, productName, productPrice, quantity, mainImage });

    // Check if the product is already in the cart
    const existingItem = cartItems.find(item => item.productId === productId);

    if (existingItem) {
      // If the product is already in the cart, update the quantity
      existingItem.quantity += quantity;
    } else {
      // If the product is not in the cart, add it
      cartItems.push({
        productId: productId,
        productName: productName,
        productPrice: productPrice,
        quantity: quantity,
        mainImage: mainImage, // Add the main image URL to the cart item
      });
    }

    // Log the updated cart items
    console.log('Updated cart items:', cartItems);

    // Send the updated cart items
    res.json(cartItems);
    
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to update cart item quantity
function updateCartItemQuantity(productId, newQuantity) {
  // Implement your logic to update the cart item quantity in memory
  const cartItem = cartItems.find(item => item.productId === productId);

  if (cartItem) {
    cartItem.quantity = parseInt(newQuantity);
  }

  // Log the updated cart items
  console.log('Updated cart items:', cartItems);

  // Return the updated cart items
  return cartItems;
}


app.put('/update-cart-item/:productId', (req, res) => {
  const productId = req.params.productId;
  const newQuantity = req.query.quantity;

  // Implement your logic to update the cart item quantity in memory
  const updatedCart = updateCartItemQuantity(productId, newQuantity);

  // Send the updated cart back to the client
  res.json(updatedCart);
});

// Function to remove item from the cart
function removeCartItem(productId) {
  // Find the index of the item with the specified productId in the cartItems array
  const itemIndex = cartItems.findIndex(item => item.productId === productId);

  // Check if the item with the specified productId is found in the cartItems array
  if (itemIndex !== -1) {
      // Remove the item from the cartItems array
      cartItems.splice(itemIndex, 1);
  }

  // Return the updated cart
  return cartItems;
}

app.delete('/remove-cart-item/:productId', (req, res) => {
  const productId = req.params.productId;

  // Implement your logic to remove the item from the cart in memory or database
  const updatedCart = removeCartItem(productId);

  // Send the updated cart back to the client
  res.json(updatedCart);
});



app.post('/submit-order', async (req, res) => {
  try {
    const formData = req.body.formData;

    // Log the received formData
    console.log('Received formData:', formData);

    // Validate that 'First_Name' is not empty
    if (!formData.fname) {
      return res.status(400).json({ success: false, message: 'First Name is required.' });
    }

    // Begin transaction
    await connection.beginTransaction();

    // Insert order into MySQL
    const orderResult = await connection.query(
      'INSERT INTO orders (Order_Cost, Order_Status, userId, First_Name, Last_Name, Email, Address, Phone_No) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [formData.totalCost, 'Pending', formData.userId, formData.fname, formData.lname, formData.email, formData.address, formData.phone]
    );

    if (!orderResult || !orderResult[0] || !orderResult[0].insertId) {
      throw new Error('Failed to insert order into the database.');
    }

    const orderId = orderResult[0].insertId;
    console.log('Order ID:', orderId);
    console.log('Cart Items:', formData.cartItems);
    console.log('Cart items before mapping:', cartItems);
    console.log('Mapped cart items:', mapCartItems(cartItems));

    // Insert order items into MySQL
    for (const item of formData.cartItems) {
      const [itemResult] = await connection.query(
          'INSERT INTO order_items (Order_ID, pID, Product_Name, Image, Price, userId, Quantity, First_Name, Last_Name, Order_Date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
          [orderId, item.pID, item.product, item.image, item.price, formData.userId, item.quantity, formData.fname, formData.lname]
      );

      console.log('Item result:', itemResult);

      if (!itemResult || !itemResult.insertId) {
          console.error('Failed to insert order item into the database:', itemResult);
          throw new Error('Failed to insert order item into the database.');
      }
    }

    // Commit the transaction
    await connection.commit();

    // Send the client a success response
    res.json({ success: true, orderId: orderId });
  } catch (error) {
    // Rollback the transaction in case of an error
    await connection.rollback();
    console.error('Error processing checkout:', error);

    res.status(500).json({ error: 'Internal Server Error' });
  }
});





app.post('/process-payment', async (req, res) => {
  try {
      const { amount, currency, paymentMethodId } = req.body;

      // Create a PaymentIntent to confirm payment
      const intent = await stripe.paymentIntents.create({
          amount,
          currency,
          payment_method: paymentMethodId,
          confirmation_method: 'manual', // Adjust as needed
      });

      // Send the client secret to the client
      res.status(200).json({ clientSecret: intent.client_secret });
  } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login', (req, res) => {
  const { email, pass } = req.body;

  // Fetch user data from the database based on the provided email
  const sql = 'SELECT * FROM User WHERE Email = ?';
  connection.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Error fetching user data:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Check if a user with the provided email exists
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = results[0];

    // Check if the provided password matches the stored password
    if (pass !== user.Password) {
      console.error('Incorrect password for user:', user.email);
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Set up a session to keep track of the logged-in user
    req.session.userId = user.userID;

    // Redirect the user to a dashboard or home page
    // Pass the user's first name to the home page
    console.log('User logged in:', user.First_Name);
    res.redirect('/home.html?fname=' + encodeURIComponent(user.First_Name));
  });
});




app.post('/register', (req, res) => {
  const { fname, lname, email, pass, phone, address } = req.body;

  // Validate input (you can add more validation)
  if (!fname || !lname || !email || !pass || !phone || !address) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  // Check if the email is already registered
  connection.query('SELECT * FROM User WHERE Email = ?', [email], (err, results) => {
    if (err) {
      console.error('Error checking existing email: ' + err.stack);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // If email is not registered, insert the new user
    const sql = 'INSERT INTO User (First_Name, Last_Name, Email, Phone, Address, Password) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [fname, lname, email, phone, address, pass];

    res.redirect('/login.html');

    connection.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting new user: ' + err.stack);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
      }

      return res.status(200).json({ success: true, message: 'User registered successfully.' });

    });
  });
});

app.get('/', (req, res) => {
  const userName = determineUserName(req); // Replace this with your logic to get the user's name
  res.render('home.html', { userName });
});





// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});