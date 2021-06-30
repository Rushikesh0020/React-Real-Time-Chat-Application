const express = require('express');
const socketio = require('socket.io');
const http = require('http'); //built in Node Module
const cors = require('cors');

const {addUser, removeUser, getUser, getUsersInRoom} = require('./users.js');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
//Lets initialize our server and pass the app that we have initialized from  express
const server  = http.createServer(app);
const io = socketio(server); //create instance of socket.io and pass the server

app.use(router);
app.use(cors());

io.on('connection', (socket) => {
    socket.on('join', ({name, room}, callback) => {
        const { error, user } = addUser({id: socket.id, name, room}); 

        if(error) return callback(error);

        socket.emit('message', { user:'admin', text: `${user.name}, Welcome to the Room ${user.room} 😇`});

        socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name}, has joined the party!🤩`});



        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})

        callback();
    });

    socket.on('sendMessage',(message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', { user: user.name, text: message});
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});

        callback();
    });


    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left.`})
        }
    })
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));









/*Socket.io is a library that enables real-time, bidirectional and event-based communication between the browser and the server. It consists of: 
        1.A Node.js server
        2.A JavaScript client library for the browser(which can be also run from Node.js)
        
*/

// If you want to do something in realtime you need to use Socket.io not HTTP Requests. (HTTP Requests are slow for real-time)