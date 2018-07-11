var socket = io();

document.getElementById("mainscreen-bg").setAttribute("style", "display: none;");

//Sets the account button if the user is logged in
if(getCookie("userSession")==''){
  document.getElementById("login-button").setAttribute("style", "display: inline-block;");
}
else {
  document.getElementById("account-button").setAttribute("style", "display: inline-block;");
}

function playOnline() {
  $('#gameselect').fadeOut(50);
  setTimeout(function() {
    $('#server-browser').fadeIn(50);
    $('#mainscreen-bg').fadeIn(50);
  },50),
  //document.getElementById("server-browser").setAttribute("style", "display: block;");
  socket.emit('serverrequest');
}

function hostLocal() {
  socket.emit('createserver', 'local', '', getCookie('sessionId'), getCookie('userSession'), 0,'1');
}

function playLocal() {
  $('#button-group').fadeOut(50);
  setTimeout(function() {
    $('#host-input').fadeIn(50);
    $('#mainscreen-bg').fadeIn(50);
  },50);
}

function connectLocal() {
  var hostid = $('#hostname').val().toUpperCase();
  console.log(hostid);
  socket.emit('joinserverrequest',getCookie('sessionId'),getCookie('userSession'),hostid,'');
}

socket.on('createserverresponse', function(){
  window.location.href = '/game';
});

socket.on('joinserverresponse', function(){
  window.location.href = '/game';
});

socket.on('errormessage', function(msg){
  alert(msg);
});

socket.on('serverresponse', function(serverlist){
  var serverSocket = io('/servers');
  updateServers(serverlist);
  serverSocket.on('updateserverlist', function(serverlist){
    updateServers(serverlist);
  });
});

function createServer() {
  //Sends a request to create a server
  socket.emit('createserver', $('#servername').val(), $('#password').val(),getCookie('sessionId'),getCookie('userSession'),1,selectedPresetId);
}

function updateServers(serverlist) {
  $('#server-list').empty();
  playerlist=[];
  serverlist.forEach(function(thisServer){
    $('#server-list').append($('<li id="server-'+thisServer.hostid+'" class="serverItem">'));
    $('#server-'+thisServer.hostid).append($('<li class = "server-name" id="server-name-'+thisServer.hostid+'">').text(thisServer.name));
      $('#server-'+thisServer.hostid).append($('<li class = "server-preset" id="server-preset-'+thisServer.hostid+'">').text(thisServer.preset));
    $('#server-'+thisServer.hostid).append($('<li class="server-members" id="server-members-'+thisServer.hostid+'">').text(thisServer.size+"/32"));
    $('#server-'+thisServer.hostid).append($('<input class="server-input" id="server-input-'+thisServer.hostid+'" placeholder="Password">').prop('disabled', thisServer.noPassword));
    $('#server-'+thisServer.hostid).append($('<button class="server-button" id="server-button-'+thisServer.hostid+'" onclick="joinServer(\''+thisServer.hostid+'\')">').prop('disabled', (thisServer.canJoin==0)).text("Join"));
  });
}

function joinServer(hostid) {
  console.log(hostid);
  socket.emit('joinserverrequest',getCookie('sessionId'),getCookie('userSession'),hostid,$('#server-input-'+hostid).val());
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

function updatePlaylistChoice(id) {}

String.prototype.hashCode = function(){
    var hash = 0;
    for (var i = 0; i < this.length; i++) {
        var character = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
