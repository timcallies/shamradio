document.getElementById('begingame').disabled = true;
const gameTime=20;
const maxRounds=10;

//Youtube API
var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
  console.log('Youtube API loaded');
}
inputScreenReverse();

//Creates two sockets, one for the server admin and one for the group
var socket = io();
var status = "lobby";
var currentRound;
var videoContainer = new videoPlayer('video-player-container');
var name;
var servername;

var hostid = undefined;

setInterval(function() {
  socket.emit('heartbeat',getCookie('sessionId'));
},500)

socket.emit('playerstatusrequest',getCookie('sessionId'));

socket.on('playerstatusresponse', function(hostidresponse,playername,isHost,isOnline,hostplayerlist,gameStatus,options,hasPlaylist,serverName) {
  hostid=hostidresponse;
  name=playername;
  servername = serverName;
  updatePlayerList(hostplayerlist);
  //updateSettings(options);


  if(gameStatus=='setup') {
    document.getElementById('setup').setAttribute("style", "display: block;");
  }
  else {
    document.getElementById('setup').setAttribute("style", "display: none;");
  }

  if(isOnline) {
    //Setup the text input screen
    if(getCookie('userSession'==''))
      document.getElementById('playersetup').setAttribute("style", "display: block;");
    document.getElementById('input-screen-container').setAttribute("style", "display: block;");
    hideInputScreen();

    if(isHost) {
      //Setup the server settings
      document.getElementById('hostsetup').setAttribute("style", "display: block;");
      document.getElementById('hostQR').setAttribute("style", "display: none;");
      document.getElementById("hostinfo").innerHTML = (servername);
      document.getElementById('playagain').setAttribute("style", "display: inline;");
    }
    else {
      document.getElementById('hostsetup').setAttribute("style", "display: none;");
      document.getElementById('playagain').setAttribute("style", "display: none;");
    }

  }
  else {
    //Setup the server settings
    document.getElementById('hostsetup').setAttribute("style", "display: block;");
    document.getElementById('chat-container').setAttribute("style", "display: none;");
    document.getElementById("hostinfo").innerHTML = (hostid);
    document.getElementById("hostQR").innerHTML = (
      "<img src='https://api.qrserver.com/v1/create-qr-code/?size=150x150&data="
      + encodeURIComponent(window.location.href.split("host")[0]
      + "play?id="+hostid)+"' onload='fadeIn(this)' style='display:none;' />"
    );
  }
  connectToHost(hostid);
});

function changeName() {
  socket.emit('changename',getCookie('sessionId'),$('#username').val());
}

socket.on('errormessage', function(msg){
  alert(msg);
  if (msg=="Couldn't find enough songs to fit the settings.") {
    document.getElementById('begingame').disabled = false;
  }
});

//Closes the host and begins the game
function beginGame() {
  document.getElementById('begingame').disabled = true;
  document.getElementById("endScreen").setAttribute("style", "display: none;");
  socket.emit('closehost',getCookie('sessionId'),hostid);
}

function updatePlayerList(hostplayerlist) {
  if(hostplayerlist.length>0)
  {
    document.getElementById('begingame').disabled = false;
  }

  hostplayerlist.sort(function(a, b) {
      var scoreA = a.score;
      var scoreB = b.score;

      if (scoreA < scoreB) return 1;
      if (scoreA > scoreB) return -1;

      return 0;
  });

  $('#users').empty();
  playerlist=[];
  var prevScore=100;
  var prevRank=0;
  hostplayerlist.forEach(function(thisPlayer){
    if(thisPlayer.score<prevScore) {
      prevScore=thisPlayer.score;
      prevRank++;
    }
    var safeUsername=thisPlayer.username.hashCode();
    $('#users').append($('<li id="'+safeUsername+'" class="user-container">'));
    $('#'+safeUsername).append($('<li id="'+safeUsername+'_name" class="username playertextclass">').text(thisPlayer.username));
    var thisScore = 'Score: '+thisPlayer.score;
    $('#'+safeUsername).append($('<li id="'+safeUsername+'_score" class="playertextclass">').text(thisScore));
    console.log(thisScore);
    $('#'+safeUsername).append($('<li id="'+safeUsername+'_rank" class="playerRank">').text(prevRank));
    playerlist.push(new Player(thisPlayer.username));
  });
}



//All the code relating to host communication
function connectToHost(hostid) {
  var hostsocket = io('/'+hostid);

  chatContainer("chat-container", socket, hostsocket);

  //When a player joins
  hostsocket.on('sendPlayerList', function(hostplayerlist){
    if(hostplayerlist.length>0)
    {
      document.getElementById('begingame').disabled = false;
    }
    updatePlayerList(hostplayerlist);
  });

  hostsocket.on('changehost', function(newhost){
    if(newhost == getCookie('sessionId'))
    {
      document.getElementById('hostsetup').setAttribute("style", "display: block;");
      document.getElementById('hostQR').setAttribute("style", "display: none;");
      document.getElementById("hostinfo").innerHTML = (servername);
      document.getElementById('playagain').setAttribute("style", "display: inline;");
    }
    else {
      document.getElementById('hostsetup').setAttribute("style", "display: none;");
      document.getElementById('playagain').setAttribute("style", "display: none;");
    }
  });

  hostsocket.on('updateSettings', function(options){
    consoleMessage(getSettingsAsText(options));
    updateSettings(options);
  });

  hostsocket.on('finishedround', function(playerPlaylists){
    hideInputScreen();
    //document.getElementById('cover').setAttribute("style", "opacity: 0.0;");
    fadeOut(document.getElementById('cover'));
    socket.emit('finishedround',hostid);
    status = "finished";
    //Adds all the player scores from the array
    var prevRank=1;
    var prevScore = playerlist[0].score;
    for(var i=0; i<playerlist.length; i++) {
      if (playerlist[i].lastPoint == 1)
        playerlist[i].tag.setAttribute("style", "background: #9ad7a3");
      else playerlist[i].tag.setAttribute("style", "background: #a44");
      if(playerlist[i].lastGuess!="none") {
        playerlist[i].scoreTag.innerHTML = (playerlist[i].lastGuess);
        playerlist[i].lastGuess="none";
      }
      if (playerlist[i].score<prevScore)
        prevRank++;
      playerlist[i].rankTag.innerHTML=prevRank;
    }

    playerPlaylists.forEach(function(player){
      console.log(player);
      $('#'+player.hashCode()).append($('<li id="'+player.hashCode()+'_inlist" class="inlist">').text('★'));
    })
  });

  hostsocket.on('scoreplayer', function(name,guess,score){
    if(status="playing"){
      console.log(score);
      for(var i=0; i<playerlist.length; i++) {
        if(playerlist[i].name==name){
          var thisPlayer=playerlist[i];
          thisPlayer.score += score;
          thisPlayer.lastPoint = score;
          thisPlayer.lastGuess = guess;
          thisPlayer.tag.setAttribute("style", "background: #969696;");
        }
      }
    }
  });

  //When a new round begins
  hostsocket.on('roundstart', function(name, album, artist, coverArt, url, type, round, hostplayerlist, length){
    document.getElementById('setup').setAttribute("style", "display: none;");
    document.getElementById('coverTimer').setAttribute("style", "animation-duration: "+length+"s;");
    document.getElementById("playscreen").setAttribute("style", "display: block;");
    document.getElementById('video-player-container').setAttribute("style", "display: inline;");
    resetGuessChoices();
    showInputScreen();
    videoContainer.stop();
    //Play round animation
    reset_animation('round-text');
    reset_animation('round-container');
    document.getElementById('round-text').innerHTML=("Round "+round);
    document.getElementById('round-container').setAttribute("style", "display: block;");
    //document.getElementById('round-container').setAttribute("style", "display: none;");
    videoContainer = new videoPlayer('video-player-container');
    updatePlayerList(hostplayerlist);
    currentRound=round;
    videoContainer.play(name, album, artist, coverArt, url, type);
  });

  hostsocket.on("endgame", function(hostplayerlist) {
    hideInputScreen();
    updatePlayerList(hostplayerlist);
    videoContainer.stop();
    document.getElementById('video-player-container').setAttribute("style", "display: none;");
    document.getElementById("endScreen").setAttribute("style", "display: block;");
    document.getElementById("endScreenText").innerHTML="<b>Game Over</b><br>Congratulations, "+playerlist[0].name+"!";
    var playermap = {};
    playerlist.forEach(function (player) {
      playermap[player.name]=player.score;
    });
    //socket.emit('endgame',hostid,playermap);
  });

  hostsocket.on("reopenhost", function(hostplayerlist) {
    document.getElementById("endScreen").setAttribute("style", "display: none;");
    document.getElementById('setup').setAttribute("style", "display: block;");
  });

  hostsocket.on("disconnect", function() {
    //alert("Error: You were disconnected from the game. Please go shout at @sirhatsley to fix his game");
    window.location.href = "/";
  });
}


/*********************************************
*                  USER LIST                 *
*********************************************/
function Player(name){
  this.name=name;
  this.tag=document.getElementById(name.hashCode());
  this.nameTag=document.getElementById(name.hashCode()+"_name");
  this.scoreTag=document.getElementById(name.hashCode()+"_score");
  this.rankTag=document.getElementById(name.hashCode()+"_rank");
  this.score = 0;
  this.lastPoint = 0;
  this.lastGuess="none"
}

function playAgain(){
  socket.emit('reopenhost', sessionId, hostid);
}

var playerlist = [];

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

/*********************************************
*             JQUERY ANIMATIONS              *
*********************************************/
window.fadeIn = function(obj) {
  $(obj).fadeIn(1000);
}

window.fadeOut = function(obj) {
  $(obj).fadeOut(1000);
}

var height = "innerHeight" in window
             ? window.innerHeight
             : document.documentElement.offsetHeight;
if (height<600)
{
  document.body.style.transform = 'scale(' + height/600 + ')';
  document.body.style.height = '600px';
  document.body.style.width = 100/(height/600)+'%';
}
else {
  document.body.style.transform = 'scale(1)';
  document.body.style.height = '100%';
  document.body.style.width = '100%';
}

window.addEventListener('resize', function(event){
  var height = "innerHeight" in window
               ? window.innerHeight
               : document.documentElement.offsetHeight;
  if (height<600)
  {
    document.body.style.transform = 'scale(' + height/600 + ')';
    document.body.style.height = '600px';
    document.body.style.width = 100/(height/600)+'%';
  }
  else {
    document.body.style.transform = 'scale(1)';
    document.body.style.height = '100%';
    document.body.style.width = '100%';
  }
});

/*********************************************
*               OPTIONS WINDOW               *
*********************************************/
var currWindow = null;
settingsContainer('settings-container');

function showWindow(windowName){
  if(currWindow != null) {
    currWindow.setAttribute("style","top:70%; visibility:hidden; opacity:0");
  }
  currWindow = document.getElementById(windowName);
  currWindow.setAttribute("style","top:50%; transform: translateY(-50%); visibility:visible; opacity:1")
  var xButton = currWindow.getElementsByClassName("window-x")[0];
  xButton.onclick = function(){
    currWindow.setAttribute("style","top:70%; visibility:hidden; opacity:0");
    currWindow=null;
  }
}

function saveSettings(options) {
  socket.emit("savesettings",getCookie('sessionId'),hostid,options);

  currWindow.setAttribute("style","top:70%; visibility:hidden; opacity:0");
  currWindow=null;
}

function reset_animation(name) {
  var el = document.getElementById(name);
  el.style.animation = 'none';
  el.offsetHeight; /* trigger reflow */
  el.style.animation = null;
}

/*********************************************
*                   GUESSES                  *
*********************************************/
function submitGuess(msg) {
  //document.getElementById('guess').value=msg;
  socket.emit('guess', msg, getCookie('sessionId'), hostid);
  hideInputScreen();
}

socket.on('possibleresults', function(tags) {
  updateGuessChoices(tags);
});

String.prototype.hashCode = function(){
    var hash = 0;
    for (var i = 0; i < this.length; i++) {
        var character = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
