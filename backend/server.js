const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: "https://dsa-tracker-mefa.vercel.app"
}));
app.use(express.json());

// Database connection
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI ;

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));
  app.get("/", (req, res) => {
  res.send("Backend Running");
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dsa', require('./routes/dsa'));
app.use('/api/aptitude', require('./routes/aptitude'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/revision', require('./routes/revision'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
