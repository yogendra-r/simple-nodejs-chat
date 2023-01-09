const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
app.use(express.json());
app.use(express.static('public'));
let users = [];
let rooms = [{name : 'Taxi',creator:"ME"}];
let roomName = "Taxi";
//let messages = [];
app.get('/' , (req,res)=>{
    res.status(200).sendFile('index.html');
})
io.on("connection" , (socket)=>{
    //console.log(socket);
    console.log(`A user connected`);
    socket.on('disconnect', ()=>{
        users = users.filter(user => user != socket.username);
        console.log(`user disconnected`);
        io.emit('updateUsers',users);
    })
    socket.on('createUser' , (userName)=>{
        console.log(`createUser..`,userName);
        //cb(users);
        if(userName === null){
            userName = "Guest";
        }
        socket.username = userName;
        
        users.push(socket.username);
        
        let usersSet = new Set(users);
        users = [];
        usersSet.forEach( v => users.push(v));    
        
        socket.room =roomName;
        socket.join(roomName);

        console.log(users);
        users = users.filter(user => user != null);
        io.emit('updateUsers',users);
        io.emit('updateRooms' , rooms);
        socket.emit('updateChat', 'INFO', `you have connected to ${socket.room}`);
        socket.to(roomName).emit('updateChat', 'INFO', userName + ' has connected to this room');
    
        //io.to(socket.room).emit('getUser',"secret message..");
       
       
    })
    
    socket.on('sendMessage' ,(msg)=>{
        //messages.push(msg);
        // io.emit('updateChat',userName,msg);
        console.log(msg);
        io.to(socket.room).emit('updateChat',socket.username,msg);
        io.to(socket.room).emit('recieveMessage',`system:`+msg);
        io.to(socket.room).emit('updateChat', "JSON", JSON.stringify({"name" : socket.username, msg : msg}));
        io.to(socket.room).emit('receiveJSON', "JSON", JSON.stringify({"name" : socket.username, msg : msg}));
        //io.to(socket.room).emit('updateChat',"ME" ,JSON.stringify({"name" : "Me"}));
    })
    
    socket.on('createRoom' , (roomName)=>{
        console.log(`create room from server`,roomName);
        console.log(`createRoom func server sk name`,socket.username);
        rooms.push({name:roomName, creator : socket.username});
        io.emit('updateRooms',rooms, socket.username);
        //io.emit('updateRooms' ,rooms,roomName);
        
    })
    socket.on('updateRooms' , (roomName)=>{
        socket.leave(socket.room);
        socket.to(roomName).emit('updateChat', 'INFO', `${socket.username} has left ${socket.room}`);

        socket.room = roomName; //updating room for socket
        socket.join(roomName);
        socket.emit('updateChat', 'INFO', `you have connected to ${socket.room}`);
        socket.to(roomName).emit('updateChat', 'INFO', `${socket.username} has connected to ${socket.room}`);
        socket.emit('updateRooms',rooms,socket.username);
    })
   
    
})

http.listen(3000 , ()=>{
    console.log(`listening at 3000`);
})
// /Volumes/DATA/Yogendra Raj/Learning/Chat App folders/multi-room-chat/server.js