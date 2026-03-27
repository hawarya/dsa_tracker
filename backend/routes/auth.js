const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name, email, dsaDailyTarget: user.dsaDailyTarget, isFirstLogin: user.isFirstLogin } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, dsaDailyTarget: user.dsaDailyTarget, isFirstLogin: user.isFirstLogin } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/setup', async (req, res) => {
  try {
    const { userId, dsaDailyTarget } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.dsaDailyTarget = dsaDailyTarget;
    user.isFirstLogin = false;
    await user.save();
    res.json({ message: 'Setup complete', user: { id: user._id, name: user.name, email: user.email, dsaDailyTarget: user.dsaDailyTarget, isFirstLogin: user.isFirstLogin } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
