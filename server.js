const express = require('express');
const request = require('sync-request'); //using for jokes and facts
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
app.use(express.json());
app.use(express.static('public'));
const con = require('./dbConfig');
const fs = require('fs');
const e = require('express');
let usersList = [];

let rooms = [{ name: 'get', creator: "ME" }, { name: 'edit', creator: "ME" }, { name: 'add', creator: "ME" }, { name: 'delete', creator: "ME"  }];
let onlineList = [];
//let messages = [];
app.use(express.static('chats'));
function UpdateDMRooms(allusers){
    
    let otherRooms = [];
    for (let i = 0; i < allusers.length; i++) {
        for (let j = 0; j < allusers.length; j++) {
            
            if (allusers[i]["name"] != allusers[j]["name"]) {
                otherRooms.push({ "name": `${allusers[i]["name"]}-${allusers[j]["name"]}`,n1: allusers[i]["name"],n2:allusers[j]["name"], creator: allusers[i]["name"] });
            }
        }
    }
    rooms = [{ name: 'get', creator: "ME" }, { name: 'edit', creator: "ME" }, { name: 'add', creator: "ME" }, { name: 'delete', creator: "ME"  }];
    for (const f in otherRooms) {
        var fields = otherRooms[f]["name"].split('-');
       
        for (const s in otherRooms) {
            var fields2 = otherRooms[s]["name"].split('-');

            if ((fields[0] == fields2[1]) && (fields[1] == fields2[0])) {
                
                otherRooms[f].name = otherRooms[s].name
            }
        }

    }
    
   return otherRooms;
}

app.get('/', (req, res) => {
    res.status(200).sendFile('index.html');
})

let jsonRes = {};
io.on("connection", (socket) => {
    console.log(`online users`,onlineList);
    console.log(`A user connected`);
    socket.on('disconnect', () => {
        //removeSocketRooms();
        console.log(`disconnect`,socket.username);
        try{
        let name = socket.username;
        onlineList = onlineList.filter(user => user.name.toLowerCase() !=name.toLowerCase());
        io.emit('updateRooms',rooms,socket.username,onlineList);
        console.log(onlineList);
        console.log(`user disconnected`);
        } catch(e){
            console.log(`disconnect error`,e);
        }
    })
    socket.on('typing' , function(userName){
        //console.log(`typing...`);
        socket.to(socket.room).emit('typingEvent',userName, userName + ' is typing...' );
        //io.to(socket.room).emit('updateChatWithDB', socket.username, msg , []);
    })
    socket.on('removeTyping' , ()=>{
        socket.to(socket.room).emit('deleteTypingElements');
    })

    socket.on('createUser',  (userName,password) => {
        //rooms = [{ name: 'get', creator: "ME" }, { name: 'edit', creator: "ME" }, { name: 'add', creator: "ME" }, { name: 'delete', creator: "ME" }];

        console.log(`createUser..`, userName);
       
        let isNameCorrect = false , isPassCorrect = false;
         con.query(`select * from Users where name = "${userName}"`, (er, user) => {
            if(er){
                console.log(`errorrrr`,er);
            }
            if(user.length > 0){
                isNameCorrect = true;
                if(password == user[0]["password"]){
                    isPassCorrect = true;
                }
                
            }
            
            if(!isNameCorrect){
                onlineList.push({name : userName});
                console.log(`condition 1`);
                let addUser = `insert into Users(name,password) values("${userName}","${password}" )`;
                
                con.query(addUser, (e, aUser) => {
                    if(e){
                        socket.emit('nameExistResult',`User Exist credentials Incorrect`);
                    }
                
                    socket.emit('updateChat', 'INFO', userName + ' has joined this room');
                    socket.username = userName;
                    socket.room = 'get';
                    socket.join('get');
        
                    con.query('select * from Users', (er, allusers) => {
                        //console.log(er);
                        //console.log(`allUserNames.. `, allusers);
                        
                        usersList = allusers;
                        io.emit('updateUsers', allusers);
                        // socket.emit("updateRooms", rooms, "get");
                        socket.to('get').emit('updateChat', 'INFO', userName + ' has connected to this room');
        
                        //working on individual chat room 
                        //person1_person2
                        //otherUsers = allusers.filter(user => user.name != socket.username);
                        let otherRooms = UpdateDMRooms(allusers);
                        rooms.push(...otherRooms);
                        let getCustomRooms = `select  * from Members`;
                        con.query(getCustomRooms , (gcrE , customRooms)=>{
                            if(e){
                                console.log(e);
                            }

                            //console.log(customRooms);
                            //console.log(`rooms`,rooms);
                            rooms.push(...customRooms);
                            io.emit('updateRooms',rooms,socket.username,onlineList);
                        })
                        //io emit so that dm also show (by creator attribute) and custom room by checking members attribute    
                    })
                })
            }  else if(isNameCorrect & isPassCorrect){
                onlineList.push({name : userName});
                console.log(`condition 2`);
                socket.emit('updateChat', 'INFO', userName + ' has joined this room');
                    socket.username = userName;
                    console.log(`name correct socket room by default`, socket.room);
                    socket.room = 'get';
                    socket.join('get');
                    let query = 'select * from Users';
                    // query = `SELECT DISTINCT * FROM Users
                    // LEFT JOIN Messages ON Users.name = Messages.sender
                    // order by created_at;`
                    con.query(query, (er, allusers) => {
                        //console.log(er);
                        //console.log(`allUserNames.. `, allusers);
                        //allUsersData = allusers;
                        usersList = allusers;
                        console.log(`new listttttt` , allusers);
                        io.emit('updateUsers', allusers);
                        // socket.emit("updateRooms", rooms, "get");
                        socket.to('get').emit('updateChat', 'INFO', userName + ' has connected to this room');
        
                        //working on individual chat room 
                        //person1_person2
                        //otherUsers = allusers.filter(user => user.name != socket.username);
                        rooms = [{ name: 'get', creator: "ME" }, { name: 'edit', creator: "ME" }, { name: 'add', creator: "ME" }, { name: 'delete', creator: "ME"  }];
                        let otherRooms = UpdateDMRooms(allusers);
                        
                        rooms.push(...otherRooms);
                        let getCustomRooms = `select  * from Members`;
                        con.query(getCustomRooms , (gcrE , customRooms)=>{
                            if(gcrE){
                                console.log(gcrE);
                            }

                            //console.log(customRooms);
                            //console.log(`rooms`,rooms);
                            rooms.push(...customRooms);
                            io.emit('updateRooms',rooms,socket.username,onlineList);
                        })
                        //io emit so that dm also show (by creator attribute) and custom room by checking members attribute    
                    })
                } else { //name correct and password incorrect
                    console.log(`condition 3`);

                    socket.emit('nameExistResult',`User Exist credentials Incorrect`);
                    
                }

                // setTimeout(()=>{
                //     if(user.length < 1){
                //         socket.emit('nameExistResult' , 'document is not loaded');
                //     }
                // },7000)
                
        
        })

    })

      
    socket.on('sendMessage', async (msg) => {
        
        let jsonReq;
        //simple chat without crud
        if(socket.room == undefined || socket.username == undefined){
            socket.emit('nameExistResult' , 'Please login again!');
            return;
        }
        //for custom and personal chat,save,fact n joke
        if(socket.room != 'get' & socket.room != 'add' & socket.room != 'edit' & socket.room != 'delete'){
            console.log(`other than 4 rooms..`);
            io.to(socket.room).emit('updateChatWithDB', socket.username, msg , []); //for current message emit []empty array so that no duplicate message will be shown
           
            ////////////////////////////////
            // jokes and facts;
            let isBored = msg.toLowerCase().includes('bored');
            let isFact = msg.toLowerCase().includes('fact');
            let isJoke = msg.toLowerCase().includes('joke');
            let isActivity =  msg.toLowerCase().includes('activity');
            let boreSuggest = ["bore" , "bored" , "bord"]
            let factSuggest = ["fact", "fct" , "fac" ]
            let jokeSuggest = ["joke", "jok" , "oke" , "jok","jke" ]
            let activitySuggest = ["activity", "activ" , "acti" , "actvt","actvty" , "activty","activity","ctivty" , "vity"];
            for(let name of boreSuggest){
                if(isBored) break;
                if(msg.toLowerCase().includes(name)){
                    isBored = true;
                }
            }
            for(let name of factSuggest){
                if(isFact) break;
                if(msg.toLowerCase().includes(name)){
                    isFact = true;
                }
            }
            for(let name of jokeSuggest){
                if(isJoke) break;
                if(msg.toLowerCase().includes(name)){
                    isJoke = true;
                }
            }
            for(let name of activitySuggest){
                if(isActivity) break;
                if(msg.toLowerCase().includes(name)){
                    isActivity = true;
                }
            }
            //console.log(isFact,isJoke);
            if(isBored){
                io.to(socket.room).emit('updateChatWithDB',"BOT", "try these keywords - fact , joke , activity" , []);
            }
            if(isFact){
                let link = `https://catfact.ninja/fact`
                let response = request('GET',link);
                response =JSON.parse( response.getBody().toString());
                console.log(response)
                io.to(socket.room).emit('updateChatWithDB', "FACT", response["fact"] , []);
            }
            if(isJoke){
                let link = `https://official-joke-api.appspot.com/random_joke`
                let response = request('GET',link);
                response = JSON.parse(response.getBody().toString());
                console.log(response)
                let joke = response["setup"] +"\n" + "punchline : "+response["punchline"]
                io.to(socket.room).emit('updateChatWithDB', "JOKE",joke ,[]);            
            }
            if(isActivity){
                let link = `https://www.boredapi.com/api/activity`
                let response = request('GET',link);
                response = JSON.parse(response.getBody().toString());
                console.log(response)
                let activity = `activity : `+response["activity"] +"\n" + "type : "+response["type"] +"\n" +"participants : "+response["participants"];
                io.to(socket.room).emit('updateChatWithDB', "Activity",activity ,[]);    
            }
            



            //////////////////////////////
            let insertMessageQuery = `insert into Messages(sender,body,created_at,room_name) values("${socket.username}" , "${msg}" , now() , "${socket.room}")`;
                con.query(insertMessageQuery , (imessErr,insertRes)=>{
                    if(imessErr){
                        console.log(`message save error`,imessErr);
                    }
                    console.log(`mess save result` , insertRes);
                    //
                    socket.to(socket.room).emit('deleteTypingElements');
               
                })
           // }
             //needed to return from here...
        }
        else{
        //console.log(jsonReq);
        //let id,name,email,password;
            try {
                jsonReq = JSON.parse(msg);
                let { id, name, email, password } = jsonReq;
                if (socket.room == 'add') {

                    console.log(typeof msg + " --" + socket.room);
                    //sender msg to room
                    io.to(socket.room).emit('updateChat', socket.username, msg);
                    let query = `insert into Users(name,email,password) values("${name}", "${email}" , "${password}")`;
                    con.query(query, (e, add) => {
                        if (e) {
                            console.log(e);
                            io.in(socket.room).emit('updateChat', "Result", JSON.stringify({ msg: e }));
                        }
                        //jsonRes = user;
                        else {

                            console.log('jr', jsonReq);

                            io.in(socket.room).emit('updateChat', "Result", JSON.stringify({ msg: "Added succesfully" }));
                            con.query(`select * from Users`, (err, allusers) => {
                                if (err) {
                                    return;
                                }
                                usersList = allusers;
                                //update Users and chat rooms
                                io.emit('updateUsers', allusers);
                                rooms = [{ name: 'get', creator: "ME" }, { name: 'edit', creator: "ME" }, { name: 'add', creator: "ME" }, { name: 'delete', creator: "ME"  }];
                                
                                let otherRooms = UpdateDMRooms(allusers);
                                rooms.push(...otherRooms);

                                let getCustomRooms = `select * from Members`;
                                con.query(getCustomRooms , (gcrE , customRooms)=>{
                                    if(e){
                                        console.log(e);
                                    }
                                    //console.log(customRooms);
                                    rooms.push(...customRooms);
                                    //io emit so that dm also show (by creator attribute) and custom room by checking members attribute
                                    io.emit('updateRooms',rooms,socket.username,onlineList);
                                    
                                })
                                
                            })
                        }
                    })
                }

            

                else if (socket.room === 'get') {
                    //console.log(typeof msg +" --"+ socket.room);
                    // console.log(msg);
                    let query = `select * from Users`;  //first get all users then find the result,so that conditional data work
                    con.query(query, (e, users) => {
                        if (e) {
                            io.to(socket.room).emit('updateChat', socket.username, msg);
                            return console.log(e);
                        }
                        io.to(socket.room).emit('updateChat', socket.username, msg);
                        let getUser;
                        if (users)
                            getUser = users.find(user => user["id"] == id);
                        // console.log('key',getUser);
                        // console.log('jr',jsonReq , "jres" , jsonRes ,getUser , getUser["name"] === socket.username );
                        if (getUser) {
                            if (getUser["name"] === socket.username) {
                                jsonRes = getUser;
                                //delete jsonRes["socket_id"];
                                //personal with all details
                                socket.emit('updateChat', "Result", JSON.stringify(jsonRes));
                                delete jsonRes["password"];
                                socket.to(socket.room).emit('updateChat', "Result", JSON.stringify(jsonRes)) //except sender
                            } else {
                                //data without pass
                                jsonRes = getUser;
                                delete jsonRes["password"];
                                //delete jsonRes["socket_id"];
                                io.in(socket.room).emit('updateChat', "Result", JSON.stringify(jsonRes));
                            }
                        } else {  
                            io.in(socket.room).emit('updateChat', "Result", JSON.stringify({ msg: "Not Exist" }));
                        }
                        //jsonRes = users;
                        console.log(`end..`);
                    })
                }
                else if (socket.room === 'edit') {

                    console.log(typeof msg + " --" + socket.room);
                    //console.log(msg);
                    let query = `select * from Users where name = "${socket.username}"`;
                    con.query(query, (e, user) => {
                        if (e) {
                            io.in(socket.room).emit('updateChat', "Result", JSON.stringify({ msg: e }));
                        }
                        //sender msg or req
                        io.to(socket.room).emit('updateChat', socket.username, msg);
                        console.log(user["id"],id,user["name"] != socket.username);
                        if (user.length > 0 & user[0]["id"] != id) {
                            //return invalid
                            io.in(socket.room).emit('updateChat', "Result", JSON.stringify({ msg: "Invalid Operation" }));
                            return;
                        } else {
                            user = user[0];
                            name = name ? name : user["name"];
                            password = password ? password : user["password"];
                            email = email ? email : user["email"];
                            query = `update Users set name = "${name ? name : user["name"]}" , email = "${email ? email : user["email"]}",password = "${password ? password : user["password"]}" where id = ${id}`;
                            con.query(query, (e, edit) => {
                                if (e) {
                                    io.in(socket.room).emit('updateChat', "Result", JSON.stringify({ msg: e }));


                                }
                                //jsonRes = user;
                                console.log('jr', jsonReq);
                                socket.username = name;
                                socket.emit('updateMyName', name);
                                console.log(`emitted name edit`);
                                console.log(`163`, socket.username, name);
                                io.in(socket.room).emit('updateChat', "Result", JSON.stringify({ msg: "Updated succesfully" }));

                                con.query(`select * from Users`, (err, allusers) => {
                                    if (err) {
                                        //return;
                                        console.log(`edit in updateroom err`,err);
                                    }
                                    io.emit('updateUsers', allusers);
                                    

                                    //updateRooms
                                    rooms = [{ name: 'get', creator: "ME" }, { name: 'edit', creator: "ME" }, { name: 'add', creator: "ME" }, { name: 'delete', creator: "ME"  }];
                                    let otherRooms = UpdateDMRooms(allusers);
                                    rooms.push(...otherRooms);
                                let getCustomRooms = `select * from Members`;
                                con.query(getCustomRooms , (gcrE , customRooms)=>{
                                    if(e){
                                        console.log(e);
                                    }
                                    //console.log(customRooms);
                                    rooms.push(...customRooms);

                                    //io emit so that dm also show (by creator attribute) and custom room by checking members attribute
                                    io.emit('updateRooms',rooms,socket.username,onlineList);
                                })
                            
                                })

                            })
                        }

                    })


                }
          
                else if (socket.room == 'delete') {
                    
                    let query = `select * from Users where name = "${socket.username}"`;
                    io.to(socket.room).emit('updateChat', socket.username, msg);
                    con.query(query, (e, user) => {
                        if (e) {
                            io.in(socket.room).emit('updateChat', "Result", JSON.stringify({ msg: e }));
                            //return console.log(e);
                        }
                        console.log(`delete user..`, user);

                        // console.log(user["id"],id,user["name"] != socket.username);
                        if (user.length > 0 & user[0]["id"] != id) {
                            //return invalid
                            io.in(socket.room).emit('updateChat', "Result", JSON.stringify({ msg: "Invalid Operation" }));
                            //return;
                        } else {
                            console.log('del else part');
                            query = `delete  from Users where id = ${id}`;
                            con.query(query, (er, del) => {
                                if (er) {
                                    io.in(socket.room).emit('updateChat', "Result", JSON.stringify({ msg: er }));

                                    return console.log(er);

                                }
                                //jsonRes = user;
                                socket.username = "NOT VALID";
                                //socket.emit('updateMyName', "");
                                //console.log(`emitting from delete name`);
                                console.log('jr', jsonReq);
                                io.in(socket.room).emit('updateChat', "Result", JSON.stringify({ msg: "Deleted successfully" }));
                                //no need to render users and rooms


                                con.query(`select * from Users`, (err, allusers) => {
                                    if (err) {
                                        //return;
                                        console.log(`edit in updateroom err`,err);
                                    }
                                    io.emit('updateUsers', allusers);
                                    

                                    //updateRooms
                                    rooms = [{ name: 'get', creator: "ME" }, { name: 'edit', creator: "ME" }, { name: 'add', creator: "ME" }, { name: 'delete', creator: "ME"  }];
                                    let otherRooms = UpdateDMRooms(allusers);
                                   
                                    rooms.push(...otherRooms);
                                    let getCustomRooms = `select * from Members`;
                                    con.query(getCustomRooms , (gcrE , customRooms)=>{
                                        if(e){
                                            console.log(e);
                                        }
                                        //console.log(customRooms);
                                        rooms.push(...customRooms);

                                        //io emit so that dm also show (by creator attribute) and custom room by checking members attribute
                                        io.emit('updateRooms',rooms,socket.username,onlineList);
                                    })
                            
                                })

                            })
                        }

                    })
                }
                //io.to(socket.room).emit('updateChat',socket.username,JSON.stringify(jsonRes));
            } catch (e) {
                // console.log(e);
                io.to(socket.room).emit('updateChat', socket.username, msg);
                return;
            }
        }
        
    })

    socket.on('createRoom', (roomName , persons) => {

        if(socket.room == undefined || socket.username == undefined){
            socket.emit('nameExistResult' , 'Please login again!');
            return;
        }

        console.log(`create room from server`, roomName);
        if(roomName.includes("-")){
            roomName = roomName.split("-");
            roomName = roomName.join("");
        }
        console.log(`createRoom func server sk name`, socket.username);
       
        // socket.emit('updateRooms',rooms, socket.username);
      
        let newRoomQuery = `insert ignore into Rooms(room_name,creator_name) values("${roomName}","${socket.username}");`;
        con.query(newRoomQuery , (error,insertRoom)=>{
            if(error){
                console.log(error);
            }
            
            let roomMembersQuery =`insert ignore into Members(member_name,room_name,room_creator) values("${socket.username}","${roomName}","${socket.username}");`;
            con.query(`select * from Users` , (err,allusers)=>{
               // console.log(`allUsers`,allusers);
                for(let person of persons){
                    //console.log(person);
                    let found = allusers.find(user => user["name"].toLowerCase() == person.toLowerCase());
                    if(found){
                        roomMembersQuery += `insert ignore into Members(member_name,room_name,room_creator) values("${person}","${roomName}", "${socket.username}");`
                    }
                }
                con.query(roomMembersQuery , (insertMemberE, memberQRes)=>{
                    if(insertMemberE){
                        console.log(`insertMemberE` , insertMemberE);
                    }
                  
                    
                    //updateRooms
                    rooms = [{ name: 'get', creator: "ME" }, { name: 'edit', creator: "ME" }, { name: 'add', creator: "ME" }, { name: 'delete', creator: "ME"  }];
                    let otherRooms = UpdateDMRooms(allusers);
                    rooms.push(...otherRooms);
                    let getCustomRooms = `select * from Members`;
                    con.query(getCustomRooms , (gcrE , customRooms)=>{
                        if(gcrE){
                            console.log(e);
                        }
                       // console.log(customRooms);
                        rooms.push(...customRooms);
                        
                        io.emit('updateRooms',rooms,socket.username,onlineList);
                    })
                })    
            })
           
           
        })
       

    })
    socket.on('checking' , (msg)=>{
        console.log(`checking,,,`,msg);
    })
    socket.on('updateRooms', (roomName) => {
         //clear previous room chat
        //delete all the chat and announcement
        socket.emit('deleteChat');
        socket.leave(socket.room);
        io.in(socket.room).emit('updateInfo',  `${socket.username} has left `,socket.room,"");
        socket.room = roomName; //updating room for socket
        socket.join(roomName);
       // console.log(`room details` , rooms);
        //custom room members
        const thisRoomDetails = rooms.filter( (room)=>{
            if(room.hasOwnProperty('room_name')){
                if(roomName == room["room_name"]){
                    return room;
                }
            }
        })
        //console.log(`filterd`,thisRoomDetails);
        let roomMembersStr = "[";
        for(let detail of thisRoomDetails){
            roomMembersStr += toTitleCase(detail["member_name"]) +"-";
        }
        roomMembersStr += "]";
        socket.to(roomName).emit('updateInfo', `${socket.username} has joined `,roomName,"");
        let reqBody="";
        if (socket.room === 'edit') {
            reqBody = { "id": 1, "name": "name", email: "email", password: "password" }
        } else if (socket.room === 'get' || socket.room === 'delete') {
            reqBody = { "id": 1 };
        } else if (socket.room === 'add') {
            reqBody = { "name": "name", email: "email", password: "password" }
        }
        let currentRoomMessages;
        con.query(`select * from Messages where room_name = "${roomName}"` , (err,res)=>{
            if(err){
                console.log(`err message `,err);
            }
            socket.emit('updateRooms', rooms, socket.username,onlineList);
           
            //console.log(`resssss`,res);
            //io.to(socket.room).emit('updateChatWithDB', socket.username,null, res);
           socket.emit('updateChatWithDB', socket.username,null, res);
           try{
            reqBody = JSON.stringify(reqBody);
           } catch(e){
            console.log(e);
           }
          
           //socket.emit('updateChatWithDB', 'INFO', `you (${socket.username}) have connected to "${socket.room}"  ${roomMembersStr.length == 2 ? "" : roomMembersStr} ${reqBody == '{}' ? "" : reqBody }`,[]);
           socket.emit('updateInfo',`you (${socket.username}) have connected to ` ,socket.room,reqBody);
           //first loading messages then notification
        })
       
    })
    socket.on('deleteChatRoom' , function(roomName,userName){
        console.log(`delete...`);
        con.query(`delete from Rooms where room_name = "${roomName}"` , (err,result)=>{
            if(err){
                console.log(`del room er`,err);
            }
            con.query(`delete from Members where room_name ="${roomName}"`,(error,res)=>{
                if(error){
                    console.log(`del room er 2`,error); 
                }
                con.query(`delete from Messages where room_name = "${roomName}"` , (error3,res3)=>{
                    if(error3){
                        console.log(`error3`);
                    }
                    con.query('select * from Users' , (usersE,allusers)=>{
                        if(usersE){
                            console.log(usersE);
                        }
                        //updateRooms
                        rooms = [{ name: 'get', creator: "ME" }, { name: 'edit', creator: "ME" }, { name: 'add', creator: "ME" }, { name: 'delete', creator: "ME"  }];
                        let otherRooms = UpdateDMRooms(allusers);
                        rooms.push(...otherRooms);
                        let getCustomRooms = `select * from Members`;
                        con.query(getCustomRooms , (gcrE , customRooms)=>{
                            if(gcrE){
                                console.log(e);
                            }
                        // console.log(customRooms);
                        rooms.push(...customRooms);
                        io.to(roomName).emit('nameExistResult','This room is deleted..');
                        io.emit('updateRooms',rooms,socket.username,onlineList);
                    })
                })
            })
        })
    })
})

    socket.on(`exportChat` , function(){
        let roomName = socket.room;
        console.log(`export chat....room name socket name`,socket.room,socket.username);
        if(socket.room != 'get' & socket.room != 'edit' & socket.room != 'add' & socket.room != 'delete'){
            con.query(`select * from Messages where room_name = "${roomName}"` , (err,chats)=>{
                if(err){
                    console.log(`err message in export chat `,err);
                }
                console.log(`chats `, chats);
                let roomChat = "";
                for(let chat of chats){
                    let dt = chat["created_at"].toString().split(/[- :]/).splice(0,7);
                  
                    let d = dt.slice(0,4);
                    let t = dt.slice(4,7);
                    //date
                   
                    let date = "" , time = "";
                    for(let dd of d){
                        date += dd+" ";
                    }
                    for(let tt of t){
                        time += tt +":";
                    }
                    dt = date +" "+ time;
                    dt = dt.substr(0,dt.length-1);
                    //console.log(date , time);
                    roomChat += `${dt} ${chat["sender"]} :- ${chat["body"]}\n`;
                }
               
                //console.log(`resssss`,res);
                //io.to(socket.room).emit('updateChatWithDB', socket.username,null, res);
                fs.writeFile(`chats/${roomName}.txt` , roomChat , function(fileE){
                    if(fileE){
                        console.log(`file save err` , fileE);
                    }

                    console.log(`chat saved`);
                    //socket.emit('send')
                    socket.emit('updateChat', "Result", `Link -  https://1864-103-47-44-154.in.ngrok.io/${roomName}.txt`);

                });
            })
             
        } else{
            socket.emit(`nameExistResult` , "Can't export chat in get,add,edit,delete chatrooms");
        }
    });


    socket.on('deleteAccount' , function(username){
        con.query(`delete from Users where name = "${username}"` , (err,res)=>{
            if(err){
                console.log(err);
            }
            con.query('select * from Users' , (usersE,allusers)=>{
                if(usersE){
                    console.log(usersE);
                }
                //updateRooms
                rooms = [{ name: 'get', creator: "ME" }, { name: 'edit', creator: "ME" }, { name: 'add', creator: "ME" }, { name: 'delete', creator: "ME"  }];
                let otherRooms = UpdateDMRooms(allusers);
                rooms.push(...otherRooms);
                let getCustomRooms = `select * from Members`;
                con.query(getCustomRooms , (gcrE , customRooms)=>{
                    if(gcrE){
                        console.log(e);
                    }
                // console.log(customRooms);
                rooms.push(...customRooms);
                io.emit('updateUsers',allusers);
                io.emit('updateRooms',rooms,socket.username,onlineList);

                socket.emit('nameExistResult','This account is deleted..');
            })
        })
    
        })
    })
  

})



function toTitleCase(str){
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
http.listen(3000, () => {
    console.log(`listening at 3000`);
})