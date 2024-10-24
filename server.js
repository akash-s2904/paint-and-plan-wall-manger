const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/paintbooking')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

// User Schema
const userSchema = new mongoose.Schema({
  fullname: String,
  email: { type: String, unique: true },
  password: String
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  date: Date
});

const User = mongoose.model('User', userSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files like HTML/CSS
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// Routes to serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '11.html'));
});

app.get('/book', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'book.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Register Route
app.post('/register', async (req, res) => {
  const { fullname, email, password, confirm_password } = req.body;
  if (password !== confirm_password) {
    return res.status(400).send('Passwords do not match');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword
    });
    await newUser.save();
    
    // Redirect to 11.html after successful registration
    res.redirect('/login');
  } catch (err) {
    res.status(400).send('Error registering user: ' + err.message);
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send('No user found with that email');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send('Incorrect password');
    }

    // Save session
    req.session.userId = user._id;

    // Redirect to 11.html after successful login
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Server error: ' + err.message);
  }
});

// Booking Route
app.post('/book', async (req, res) => {
  const { name, phone, email, date } = req.body;

  const newBooking = new Booking({
    name,
    phone,
    email,
    date
  });

  try {
    await newBooking.save();
    res.send('Booking successful');
  } catch (err) {
    res.status(400).send('Error booking: ' + err.message);
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
