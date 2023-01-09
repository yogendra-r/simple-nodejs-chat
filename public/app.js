var socket = io();


var exportChatBtn = document.querySelector("#export_chat_btn");

var userlist = document.getElementById("active_users_list");
var roomlist = document.getElementById("active_rooms_list");
var message = document.getElementById("messageInput");
var sendMessageBtn = document.getElementById("send_message_btn");
var roomInput = document.getElementById("roomInput");
var createRoomBtn = document.getElementById("room_add_icon_holder");
var chatDisplay = document.getElementById("chat");
var Name_name = document.getElementById("Name_name");
var body = document.querySelector(".app");
var currentRoom = "get";
var myUsername = "";
var today = String(new Date());
var myUserPass = "";
// setTimeout( 
//   function(){
//     let userCards = document.querySelectorAll(".user_card");
//     let roomCards = document.querySelectorAll(".room_card");
//     console.log(userCards,roomCards);
//     alert(userCards,roomCards)
//     if(!userCards || !roomCards || userCards.length < 1 || roomCards.length < 1){
     
//       document.location.reload();
//     }
//   }, 10000);

let allAnnouncements = document.querySelectorAll("#chat .announcement span");

socket.on("connect", function () {
 
  if(!message.value || message.value == ""){
    socket.emit('removeTyping'); 
  }
   // Prompt for username on connecting to server
    myUsername = prompt("Enter name: ");
    while(!myUsername || myUsername == "" || myUsername.trim(" ") == "" || (myUsername.length > 0 & myUsername.charCodeAt(0) >= 32 & myUsername.charCodeAt(0) <= 64 ) || 
    (myUsername.length > 0 & myUsername.charCodeAt(0) >= 91 & myUsername.charCodeAt(0) <= 96) || 
    (myUsername.length > 0 & myUsername.charCodeAt(0) >= 123 & myUsername.charCodeAt(0) <= 126)
    ){
      myUsername = prompt("Enter name: ");  
    }
    
    myUserPass = prompt("Enter Password: ");
    while(!myUserPass || myUserPass == "" || myUserPass.trim(" ") == ""){
      myUserPass = prompt("Enter Password: ");
    }
    
    console.log(`username:`,myUsername)
    //socket.emit('isNameExist' , myUsername);
     socket.on('nameExistResult',function (msg){
     // console.log(`data...`,msg);
      alert(msg);
      //avoid this msg reload..otherwise reload
      if(msg !=  "Can't export chat in get,add,edit,delete chatrooms")
        document.location.reload();
    })
    
    socket.emit("createUser", myUsername,myUserPass);
    
    Name_name.innerHTML = `<span>Hello <span class="colored" >${myUsername}</span></span><br>`;

   
   
      
});

sendMessageBtn.addEventListener("input", function () {
  if(!message.value || message.value == ""  || !message.value.trim(" ")){
    socket.emit('removeTyping');
  }

});
// Send message on button click
sendMessageBtn.addEventListener("click", function () {
 
  if(!message.value || message.value == ""  || !message.value.trim(" ")){
    socket.emit('removeTyping');
    return false; //to avoid listener for empty string
  }

  socket.emit("sendMessage", message.value);
  
  //clear typing log after send
  message.value = "";
  if(!message.value || message.value == "" || !message.value.trim(" ")){
    socket.emit('removeTyping');
  }
  
});
socket.on('deleteTypingElements' , function(){
   //delete all the typing elements
  let typingEl = document.querySelectorAll(".typing");
  for(let el of typingEl){
    console.log(`deleting..`);
    el.remove();
  }
})
let except = message;
body.addEventListener("click", function () {
  socket.emit('removeTyping');
}, false);
except.addEventListener("click", function (ev) {
  socket.emit('typing',myUsername);
  ev.stopPropagation(); //this is important! If removed, you'll get both alerts
}, false);

exportChatBtn.addEventListener("click" , function(){
  //alert(`export chat called`);
  socket.emit('exportChat' , 'asdasdasda');
});
//typing....
message.addEventListener("keypress" , function(event){
  if (event.key === "Enter") {
    sendMessageBtn.click();
  }
  if(!message.value || message.value == "" || !message.value.trim("") || message.value.trim().length<1){
    socket.emit('removeTyping');
  } else{
    socket.emit('typing',myUsername);
    console.log(`typing....`);
  }
})

// Send message on enter key press
// message.addEventListener("keyup", function (event) {
//   if (event.key === "Enter") {
//     sendMessageBtn.click();
//   }
// });

// Create new room on button click
createRoomBtn.addEventListener("click", function (e) {
  // socket.emit("createRoom", prompt("Enter new room: "));
  //alert("room create");
  
  let inputRoomName = document.querySelector("#roomInput").value;
  //console.log(`input room name`,inputRoomName);
  if(!inputRoomName || inputRoomName == ""){
    //e.stopPropagation();
    return false;
  }
  let userstoAdd = prompt("Enter Users with comma: ").split(",");
  //console.log('custom room users name',userstoAdd);
  //console.log(userstoAdd);
  let roomName = roomInput.value.trim();
  //console.log(`roomname`,roomName);
  if (roomName !== "") {
   // console.log(`room creating emit`,roomName);
    socket.emit("createRoom", roomName , userstoAdd);

    roomInput.value = "";
  }
});
socket.on('typingEvent' ,function (userName, data){
 
  try{
    let allTypingEl = document.querySelectorAll(".typing span");
    let lastTypingEL = allTypingEl[allTypingEl.length - 1];
    if(lastTypingEL.innerText == data){
      //console.log(`same...`);
      return;
    }
  } catch(e){
    console.log(e);
  }
   
  
  chatDisplay.innerHTML += `<div class="message_holder typing ${
   userName.toLowerCase() === myUsername.toLowerCase() ? "me" : ""
  }">
                              <div class="pic"></div>
                              <div class="message_box">
                                <div id="message" class="message">
                    
                                  <span class="message_text ">${data}</span>
                                </div>
                              </div>
                            </div>`;

})
socket.on("updateChatWithDB", function (username, data,currentRoomMessages) {
  console.log(`withdb `,data);
  if (username === "INFO") {
    //console.log("Displaying announcement"); 
    chatDisplay.innerHTML += `<div class="announcement"><span>${data}</span></div>`;
  } else {
    
    if (data == '{"msg":"Deleted successfully"}'){
      //console.log('reload');
        document.location.reload();
    }
    //already present messages show
    for(let messageObj of currentRoomMessages){
     // console.log("Displaying user message");
      chatDisplay.innerHTML += `<div class="message_holder ${
        messageObj["sender"].toLowerCase() === myUsername.toLowerCase() ? "me" : ""
      }">
                                  <div class="pic"></div>
                                  <div class="message_box">
                                    <div id="message" class="message">
                        
                                      <span class="message_name">${(messageObj["sender"])}</span>
                                      <span class="message_text">${(messageObj["body"])}</span>
                                    </div>
                                  </div>
                                </div>`;
    }
    if(data != null){
      //console.log("Displaying user message");
      chatDisplay.innerHTML += `<div class="message_holder ${
        username.toLowerCase() === myUsername.toLowerCase() ? "me" : ""
      }">
                                  <div class="pic"></div>
                                  <div class="message_box">
                                    <div id="message" class="message">
                        
                                      <span class="message_name">${username}</span>
                                      <span class="message_text">${data}</span>
                                    </div>
                                  </div>
                                </div>`;
    }
  
    }
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});
socket.on('updateInfo',function(data,roomName,reqBody){
  console.log(`updateInfo`);
   //console.log("Displaying announcement");
   let personName = "";
   try{
     let persons =  roomName.split("-");
     if(persons[0].toLowerCase() == myUsername.toLowerCase()){
       personName = persons[1];
     } else if(persons[1].toLowerCase() == myUsername.toLowerCase()){
       personName = persons[0];
     }
     chatDisplay.innerHTML += `<div class="announcement"><span>${data + personName}</span></div>`;
   } catch(e){
       console.log(e);
       chatDisplay.innerHTML += `<div class="announcement"><span>${data + roomName + reqBody}</span></div>`;
   }
})
socket.on("updateChat", function (username, data){
  console.log(`only updatechat`,data);
  if (username === "INFO") {
    //console.log("Displaying announcement");
    chatDisplay.innerHTML += `<div class="announcement"><span>${data}</span></div>`;
  } else {
   
    if (data == '{"msg":"Deleted successfully"}'){
      //console.log('reload');
        document.location.reload();
    }
   if(data != null){
    //console.log("Displaying user message");
    chatDisplay.innerHTML += `<div class="message_holder ${
      username === myUsername ? "me" : ""
    }">
                                <div class="pic"></div>
                                <div class="message_box">
                                  <div id="message" class="message">
                      
                                    <span class="message_name">${username}</span>
                                    <span class="message_text">${data}</span>
                                  </div>
                                </div>
                              </div>`;
   }
  }

  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

socket.on("updateUsers", function (users) {
  
  userlist.innerHTML = "";
  //console.log("usernames returned from server", users);
  if(!users || users.length < 1){
    document.location.reload();
  }
  for (var user of users) {
    if(user["name"].toLowerCase() == myUsername.toLowerCase()){
      userlist.innerHTML += `<div  class="user_card">
      <div class="pic"></div>
      <span style='color : #1ecdc5;' >${users.indexOf(user)+1}. ${toTitleCase(user["name"])}<span style='color : #CB885E'>[${user["id"]}]</span></span><button class="delete_chatroom_btn " style="margin-left:0;" onclick=deleteAccount()>🗑</button>
      </div>`;
    } else{
      userlist.innerHTML += `<div  class="user_card">
                              <div class="pic"></div>
                              <span>${users.indexOf(user)+1}. ${toTitleCase(user["name"])}<span style='color : #CB885E'>[${user["id"]}]</span></span>
                            </div>`;
    }
    
  }
  //console.log('names:',myUsername);
  //document.getElementById("Y").classList.add("active_item");
});

function deleteAccount(){
  alert('deleting Account');
  let input = prompt('Please write "DELETE"');
  if(input == 'DELETE')
    socket.emit('deleteAccount',myUsername);
  else{
    alert('Invalid input');
  }
 
}



















socket.on("updateMyName" , (newName)=>{
  console.log(`updating name`);
  myUsername = newName;
})


socket.on("updateRooms", function (rooms ,currentUser,onlineList){
  //console.log(rooms.length);
  roomlist.innerHTML = "";
  //currentRoom = newRoom;
  //console.log(`inside update Rooms `,socket.username,io.username);
  //console.log(`OUTSIDE LOOPS`);
 // console.log(`same -3 `,rooms)
  for (var room of rooms) {
    //console.log(`room print`,room);
    if ((room.hasOwnProperty("creator") == true)){
      if(room.creator =='ME'){
       // console.log(`executing me condition`);
        roomlist.innerHTML += `<div class="room_card" id="${room.name}"
        onclick="changeRoom('${room.name}')">
        <div class="room_item_content">
            <div class="pic"></div>
            <div class="roomInfo">
            <span class="room_name">#${room.name}</span>
            <span class="room_author">${room.creator}</span>
            </div>
        </div>
    </div>`; 
    //continue;
      } else {
        if(room["creator"].toLowerCase() == myUsername.toLowerCase()){
         
         // console.log(`executing creator & not members condition`);
          let displayName="" , names;
          try{
            names = room["name"].split("-");
            
            if(names[0].toLowerCase()  == myUsername.toLowerCase() ){
              displayName = names[1];
            } else{
              displayName = names[0];
            }

            let isOnlineUser = onlineList.find(user => user.name.toLowerCase() == displayName.toLowerCase());
            
            roomlist.innerHTML += `<div class="room_card" id="${room.name}"
            onclick="changeRoom('${room.name}')">
            <div class="room_item_content online">
                <div class="pic"></div>
                <div class="roomInfo">
                <span class="room_name" >${toTitleCase(displayName)}       <span style="color:green" style="font-size:small"> ${isOnlineUser ? " online" : ""}</span> </span>
                </div>
            </div>
        </div>`; 
          } catch(e){
            console.log(`names error`,names);
            console.log(`error`,e);
          }
        }
      }
    }  else{  //custom rooms
      //console.log(`executing  members condition 3`);
     try{
      if((room.hasOwnProperty("room_name") == true)  & (myUsername.toLowerCase() == room["member_name"].toLowerCase())){
        let membersCount = 0;
        let currentRoomName = room.room_name;
        for(let roomitr of rooms){
          if(roomitr["room_name"] == currentRoomName){
            membersCount++;
          }
        }
        let isCreator = myUsername.toLowerCase() == room["room_creator"].toLowerCase();
        console.log(`creator---`,isCreator);
        let creator_element = `<span class="delete_chatroom_btn" onclick=deleteGroup('${room.room_name}','${myUsername}')>&nbsp  &nbsp🗑</span>`;
        roomlist.innerHTML += `<div class="room_card" id="${room.room_name}"
        onclick="changeRoom('${room.room_name}')">
        <div class="room_item_content">
            <div class="pic"></div>
            <div class="roomInfo">
            <span class="room_name">#${room.room_name} ${isCreator ? creator_element : ""} </span>
            <span class="room_author" style='color : #CB885E'>${toTitleCase(room["room_creator"])} ~ ${membersCount } members</span>
            </div>
        </div>
      </div>`; 
      }
     } catch(e){
      console.log(e);
     }     
  }  
}
  //console.log(`cr..`,currentRoom);
  try{
  document.getElementById(currentRoom).classList.add("active_item");
  } catch(e){
    console.log("styling group",e);
    currentRoom = 'get'; //because styling would stop after deleting group..
    //socket.emit("updateRooms", currentRoom);
  }
});


socket.on('message',(msg)=>{
  //console.log(`message`,msg);
})
socket.on("updateMyName", (newName) => {
  //console.log(`updating name`);
  myUsername = newName;
  
  Name_name.innerHTML = `<span>Hello <span class="colored">${myUsername}</span></span><br>`;
})

socket.on('deleteChat' , function(){
  let ancNchats = document.querySelectorAll(".chat div");
  for(let el of ancNchats){
    el.remove();
  }
});


function changeRoom(room) {
  //adding condition for same also so that,ui behave correctly...with styling
  //so that style gets updated
  if (room == currentRoom || room != currentRoom) {
    socket.emit("updateRooms", room);
    document.getElementById(currentRoom).classList.remove("active_item");
    currentRoom = room;
    document.getElementById(currentRoom).classList.add("active_item");
  }
}
function display_c() {
  var refresh = 1000; // Refresh rate in milli seconds
  mytime = setTimeout('display_ct()', refresh)
}

function display_ct() {
  var x = String(new Date()).substring(0, 24)
  document.getElementById('ct').innerHTML = x;
  display_c();
}

function toTitleCase(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function deleteGroup(roomName,userName){
  let input = prompt('Please write "DELETE"');
  //console.log(`delelteeeee`);
  if(input == 'DELETE')
    socket.emit('deleteChatRoom' ,roomName,userName);
  else{
    alert('Invalid input');
  }
}