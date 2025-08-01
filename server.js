const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/uploadRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const authRoutes = require('./auth/auth.routes');
require('dotenv').config();
const connectDB = require('./config/db');
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
const PORT = process.env.PORT || 3001;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Server } = require('socket.io');
const socketHandler = require('./socket');
const chatRoutes = require('./routes/chat');
const http = require('http');
const server = http.createServer(app);
const usersRoutes = require('./adminRoutes/users');

// Domain Hosting Account(kartik.er.vit@gmail.com) {https://app.netlify.com/projects/luminous-capybara-aded1d/deploys/687dddcd55631c0caddccfea}
// cloudinary Account (er.kartik93@gmail.com) {https://console.cloudinary.com/app/c-2057885021e4bb5c1571887d9ac4b3/assets/media_library/search?q=&view_mode=mosaic}
// Render Account (er.kartik93@gmail.com) {https://dashboard.render.com/web/srv-d1v1crer433s73f80dc0/deploys/dep-d1v1mdje5dus739cqf90}
// Stripe Account (er.kartik93@gmail.com) {https://dashboard.stripe.com/test/settings/user}
// mongo DB Connection (kartikv437@gmail.com) {https://cloud.mongodb.com/v2/6811a4298f33665f0251b2e4#/metrics/replicaSet/6811a5b3ffd707258c2c9e2e/explorer/sample_mflix/comments/find}
// Brevo Account (er.kartik93@gmail.com) {https://app.brevo.com/settings/keys/smtp}

const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('send_message', (data) => {
    console.log('Message received:', data);
    socket.broadcast.emit('receive_message', data); // Send to all except sender
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

connectDB();
app.use('/', uploadRoutes);

app.use('/', applicationRoutes);

app.use('/auth', authRoutes);

app.use('/', usersRoutes);

app.use((err, req, res, next) => {
  console.log(`Error: ${err.message}`);
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

socketHandler(io);

app.listen(PORT, () => console.log(`Server running on port:${PORT}`));
