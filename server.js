const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {}; // Store connected users with their userId

// User connects to the server
io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  // Register user when they send a userId
  socket.on('registerUser', ({userId}) => {
    if (userId) {
      users[userId] = socket.id;
      console.log(`User registered: ${userId}`);
      console.log('users:', users);
    } else {
      console.error('User ID not provided.');
    }
  });

  // Listen for the 'callUser' event
  socket.on('callUser', (data) => {
    console.log(data);
    const { userId, signalData } = data;
    console.log(userId, signalData);
    if (!userId || !signalData) {
      console.error('Missing data in callUser event:', data);
      return;
    }

    console.log(`Calling user: ${userId}`);
    console.log('users:', users);
    console.log('users[userId]:', users[userId]);
    // If the userId exists in the 'users' object, send the signal data
    if (users[userId]) {
      io.to(users[userId]).emit('incomingCall', {
        signalData,
        callerId: socket.id,
      });
    } else {
      console.error(`User ${userId} not available.`);
      socket.emit('userUnavailable', { message: `User ${userId} is not available.` });
    }
  });

  // Listen for the 'answerCall' event
  socket.on('answerCall', (data) => {
    console.log('Answering call');
    const { signalData, callerId } = data;
    console.log(signalData, callerId);
    if (!signalData || !callerId) {
      console.error('Missing data in answerCall event:', data);
      return;
    }
    const userId = Object.keys(users).find(key => users[key] === callerId);
    if (userId) {
      io.to(userId).emit('callAccepted', signalData);
    } else {
      console.error(`Caller ${userId} not available.`);
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    // Remove user from the users object when they disconnect
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        console.log(`User ${userId} disconnected: ` + socket.id);
        break;
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Signaling server running on http://localhost:3000');
});
