var socket = io();
var tags = [];
var name = "";
var hostid;

inputScreen();

socket.emit('playerstatusrequest',getCookie('sessionId'));

socket.on('playerstatusresponse', function(hostidresponse,playername,isHost,isOnline,hostplayerlist,gameStatus,options,hasPlaylist,serverName,password) {
  hostid=hostidresponse;
  name=playername;
  document.getElementById('spotify-button').disabled=(hasPlaylist>0);
  //updateSettings(options);
  if(gameStatus=='setup'){
    document.getElementById("setup").setAttribute("style", "display: none;");
  }
  connectToHost(hostid);
});

socket.on('possibleresults', function(tags,query) {
  updateGuessChoices(tags,query);
});

function changeName() {
  socket.emit('changename',getCookie('sessionId'),$('#username').val());
}


//Connects to host & contains code between host and client
function connectToHost(hostid)
{
  var hostsocket = io('/'+hostid);
  //When a round starts
  hostsocket.on('roundstart', function(name, album, artist, coverArt, url, type, round, hostplayerlist, length){
    document.getElementById("setup").setAttribute("style", "display: none;");
    console.log('Ready');
    inputActive=1;
    showInputScreen();
    resetGuessChoices();
  });
  //When a round ends
  hostsocket.on('finishedround', function(){
    inputActive=0;
    hideInputScreen();
  });

  hostsocket.on('updateSettings', function(options){
    //updateSettings(options);
  });
}

function submitGuess(msg) {
  //document.getElementById('guess').value=msg;
  socket.emit('guess', msg, getCookie('sessionId'), hostid);
  hideInputScreen();
}

function changeName() {
  socket.emit('changename',getCookie('sessionId'),$('#username').val());
}

function getCookie(cname) {
  //Stolen from w3schools
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
      }
  }
  return "";
}

//Stolen from stackoverflow
function findGetParameter(parameterName) {
var result = null,
    tmp = [];
location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    });
return result;
}

setInterval(function() {
  socket.emit('heartbeat',getCookie('sessionId'));
},500)
