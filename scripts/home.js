var socket = io();
var currentwindow = null;
//1 = online, 2 = local

if(getCookie('lastPlayed')=='anime'){
  socket.emit('albumartrequest','anime');
}
else {
  socket.emit('albumartrequest','music');
}



socket.on('albumartresponse', function(covers){
  for(var i=0; i<covers.length; i++) {
    console.log(covers[i]);
    $('#albumartscroll').append(($('<img class="albumart">').css({
      'background-image': "url('"+covers[i]+"')",
    })));
  }

  var counter = 0;
  var limit = 500;
  setInterval(function(){
    if(counter>=limit) {
      counter=0;
      $('#albumartscroll').append($('.albumart:first-child').detach());
    }
    let width = $('.albumart:first-child').width();
    $('#albumartscroll').css('left',-(width/limit)*counter);
    counter++;
  },50);


  /*$('.albumart').animate({
    opacity: 0.1 },
  {
    duration: 10000,
    easing: 'linear',
    complete: function() {
      $('.albumart').animate({
        opacity: 0 },
      {
        duration: 10000,
        easing: 'linear',
        complete: function() {
          socket.emit('albumartrequest');
        }
      });
    }
  });*/
});

$.get("/scripts/playlistSelect.html", function(data){
  document.getElementById('playlist-select-container').innerHTML=data;
  presetsLoaded();
});

//Sets the account button if the user is logged in
if(getCookie("userSession")==''){
  document.getElementById("login-button").setAttribute("style", "display: inline-block;");
}
else {
  document.getElementById("account-button").setAttribute("style", "display: inline-block;");
}

function playOnline() {
  currentwindow=1;
  $('#button-group').animate({left: '-50%', opacity: '0'});
  $('#description').animate({height: '1px', opacity: '0'});
  $('#host-input').css({display: 'none'});
  $('#server-browser').css({display: 'block'});
  $('#mainscreen').css({left: '150%', opacity: '0', display: 'block'});
  $('#mainscreen').animate({left: '50%', opacity: '1'});
  socket.emit('serverrequest');
}

function goBack() {
  if (currentwindow ==  1) {
    $('#button-group').animate({left: '50%', opacity: '1'});
    $('#mainscreen').animate({left: '150%', opacity: '0'});
  }

  if (currentwindow ==  2) {
    $('#button-group').animate({left: '50%', opacity: '1'});
    $('#mainscreen').animate({left: '-50%', opacity: '0'});
  }
  $('#description').css({height:'auto', opacity: '1'})
  currentwindow=0;
}

function hostLocal() {
  socket.emit('createserver', 'local', '', getCookie('sessionId'), getCookie('userSession'), 0,'1');
}

function playLocal() {
  currentwindow=2;
  $('#button-group').animate({left: '150%', opacity: '0'});
  $('#description').animate({height: '1px', opacity: '0'});
  $('#server-browser').css({display: 'none'});
  $('#host-input').css({display: 'block'});
  $('#mainscreen').css({left: '-50%', opacity: '0', display: 'block'});
  $('#mainscreen').animate({left: '50%', opacity: '1'});
}

function connectLocal() {
  var hostid = $('#hostname').val().toUpperCase();
  console.log(hostid);
  socket.emit('joinserverrequest',getCookie('sessionId'),getCookie('userSession'),hostid,'');
}

function scrollDown() {
  window.scrollBy({
    left: 0,
    top: window.innerHeight,
    behavior: 'smooth'});
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

function presetsLoaded() {}

function updatePresets(presets) {
  refreshPresets(presets);
}

function joinServer(hostid) {
  window.location.href = '/game/'+hostid;
  //socket.emit('joinserverrequest',getCookie('sessionId'),getCookie('userSession'),hostid,$('#server-input-'+hostid).val());
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
