var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/*******************************************
*               NETWORK CODE               *
*******************************************/

//Main landing page
app.get('/', function(req,res){
  res.sendFile(__dirname + '/index.html');
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  res.cookie('sessionId',text);
});

//Host page
app.get('/host', function(req,res){
  var hostid = createHost();
  res.cookie('hostid',hostid);
  res.sendFile(__dirname + '/host.html');
});

//Player page
app.get('/play', function(req,res){
  res.sendFile(__dirname + '/play.html');
});

//Socket listener
http.listen(3000, function(){
  console.log('listening on *:3000');
});


/*******************************************
*         HOST/PLAYER INFORMATION          *
*******************************************/

//Defines a single player
function Player(username, socket, hostid){
  this.username=username;
  this.socket=socket;
  this.hostid=hostid;
  var score=0;
}

//Defines the host of a game
function Host(hostid){
  this.hostid=hostid;
  var playerlist=[];
  var thisHost = io.of('/'+hostid);
  thisHost.on('connection', function(socket){
    console.log('someone connected to ' +hostid);
  });
}

//Dictionary where the key is the hostid and the value is the host
var hostlist = {};

//Creates a host
function createHost()
{
  var hostid = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 4; i++)
    hostid += possible.charAt(Math.floor(Math.random() * possible.length));

  //Checks if a hostid exists, otherwise creates another one.
  while(hostid in hostlist)
  {
    hostid = "";
    for (var i = 0; i < 4; i++)
      hostid += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  hostlist[hostid] = Host(hostid);
  return hostid;
}
