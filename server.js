const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

require('dotenv').config();


const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointment');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);


mongoose.connect('mongodb://127.0.0.1:27017/mxpertz', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'));

app.listen(5000, () => console.log('Server running on port 5000'));