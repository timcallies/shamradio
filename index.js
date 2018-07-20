var app = require('express')();
var cookieParser = require('cookie-parser')
var anilist = require('./anilist-import.js');
var accounts = require('./accounts.js');
var lastfm = require('./lastfm-import.js');
var fetch = require('isomorphic-fetch');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var playlists = require('./playlists.js');
var MongoClient = require('mongodb').MongoClient;
var spotify = require('./spotify-import.js');
var _ = require('lodash');
var md5 = require('md5');
var configs = require('./configs.js');
var url = configs.getMongoURL();
const baseUrl="http://www.shamradio.com";
//const baseUrl="http://10.0.0.53";

var favicon = require('serve-favicon');
var update = require('./update.js');

app.use(cookieParser());

app.use(favicon(__dirname + '/img/favicon.ico'));

/*******************************************
*               NETWORK CODE               *
*******************************************/
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("shamradio");
  var songCollection = dbo.collection("Songlist");
  var animeCollectionTest = dbo.collection("AnimeTest");
  var animeCollection = dbo.collection("Animelist");
  var presetCollection = dbo.collection('Presets');
  var users = dbo.collection("Users");
  console.log("Database created!");

  /*var index = 0;
  animeCollection.find({songid: {$not: { $eq: "dupe"} } }).forEach( function(song){
    index++;
    setTimeout(function () {
      anilist.updateShow(song);
    }, index * 1000);
  });

  var songIndex = 0;
  songCollection.find({songid: {$not: { $eq: "dupe"} } }).forEach( function(song){
    songIndex++;
    setTimeout(function () {
      lastfm.updateSong(song);
    }, songIndex * 1000);
  });*/

  //anilist.getAnilist("sirhatsley",undefined);
  /*
  spotifyApi.getPlaylistTracks("fydyazyqid09ydgboz5nrwvh2","4US6nMDxjms88MsH9fnh7w",{ limit : 100, offset:200})
    .then(function(data) {
      data.body.items.forEach(function(track) {
        addSongFromSpotify(track.track.id);
      });
    }, function(err) {
      console.log(err);
    });*/


  //Main landing page
  app.get('/', function(req,res){
    if(checkSessionID(req)) {
      removePlayer(req.cookies.sessionId);
    }
    createSessionID(req, res);
    res.sendFile(__dirname + '/html/home.html');
  });

  //Host page
  app.get('/game', function(req,res){
    try {
      if (checkSessionID(req)) {
        thisPlayer = playerlist[req.cookies.sessionId];
        thisHost = hostlist[thisPlayer.hostid];
        //If this player is on an online game, or is hosting a local game
        if (thisHost.isOnline==1 || thisHost.hostPlayer==req.cookies.sessionId) {
          res.sendFile(__dirname + '/html/game.html');
        }
        else {
          res.sendFile(__dirname + '/html/play.html');
        }

      } else {
        res.redirect('/');
      }
    } catch (err) {console.log(err);}
  });

  //Connects a player if they use the URL to play
  app.get('/game/:hostid', function(req, res) {
    var sessionId = createSessionID(req, res);
    var nickname = req.query.name;
    if(!(req.params.hostid in hostlist)) {
      res.redirect('/');
      return;
    }

    else if(hostlist[req.params.hostid].playerlist.length > 32) {
      res.redirect('/');
      return;
    }

    else if(hostlist[req.params.hostid].password!='' && hostlist[req.params.hostid].password!=undefined) {
      if(req.query==undefined) {
        res.redirect('/');
        return;
      }
      else if(req.query.p != hostlist[req.params.hostid].password) {
        res.redirect('/');
        return;
      }
    }

    var hostid = req.params.hostid;
    var userSession = req.cookies.userSession;


    accounts.checkUserSession(userSession).then(function(account){
      var thisServer = hostlist[hostid];

      var thisPlayer;
      if(account==null && nickname == null){
        res.redirect('/login?r='+req.url.split('/').pop());
      }
      else {
        if(nickname == null) {
          thisPlayer = new Player(account.username,hostid,sessionId);
          thisPlayer.userSession=userSession;
        }
        else {
          if(nickname.length>20) {nickname = nickname.substring(0,20);}
          thisPlayer = new Player(generateGuestName(thisServer.playerlist,nickname),hostid,sessionId);
        }

        playerlist[sessionId]=thisPlayer;
        thisServer.connectedplayers++;

        thisServer.playerlist.push(thisPlayer);

        io.of('/'+hostid).emit('consolemessage', (thisPlayer.username+ " joined the game."));
        io.of('/'+hostid).emit('sendPlayerList',getPlayerList(hostid));
        io.of('/servers').emit('updateserverlist', shortServerList());
        res.redirect('/game');
      }
    });
  });

  app.get('/login', function(req,res){
    if(req.cookies.userSession==null){
      res.sendFile(__dirname + '/html/login.html');
    }
    else {
      var account = accounts.checkUserSession(req.cookies.userSession).then(function(data){
        if (data==null) {
          res.sendFile(__dirname + '/html/login.html');
        }
        else {
          res.redirect('/account');
        }
      });
    }
  });

  app.get('/account', function(req,res){
    accounts.checkUserSession(req.cookies.userSession).then(function(account){
      if (account!=null) {
        res.sendFile(__dirname + '/html/account.html');
      }
      else {
        res.redirect('/login');
      }
    });
  });

  app.get('/addmusic', function(req,res){
    res.sendFile(__dirname + '/html/addmusic.html');
  });

  //Player page
  app.get('/play', function(req,res){
    checkSessionID(req, res);
    res.sendFile(__dirname + '/html/play.html');
  });

  app.get('/img/:id', function(req,res){
    res.sendFile(__dirname +req.url)
  });
  app.get('/scripts/:id', function(req,res){
    res.sendFile(__dirname +req.url)
  });
  app.get('/css/:id', function(req,res){
    res.sendFile(__dirname +req.url)
  });

  function createSessionID(req, res) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 10; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    res.cookie('sessionId',text);
    return text;
  }

  //Returns true if the sessionID exists, false otherwise
  function checkSessionID(req) {
    if(req.cookies.sessionId in playerlist) {
      return true;
    } else {
      return false;
    }

  }

  app.get('/spotify', function(req, res) {
    var query = require('url').parse(req.url,true).query;
    var scopes = 'user-read-private user-read-email user-top-read user-library-read user-library-modify';
    if(query.code==undefined)
      res.redirect('https://accounts.spotify.com/authorize' +
        '?response_type=code' +
        '&client_id=' + '6d404988dbe84c42b2ffb44735ac6ab0' +
        (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
        '&redirect_uri=' + encodeURIComponent(baseUrl+"/spotify"));
    else{
      spotify.addUser(req.cookies.userSession,query.code);
      res.sendFile(__dirname +'/html/close.html')
    }

  });

  //Socket listener
  http.listen(process.env.PORT || 80, function(){
    console.log('listening on *:80');
  });

  //On connection
  io.on('connection', function(socket){
    //Gets the status of the current player at the sessionId;
    socket.on('playerstatusrequest', function(sessionId){
      if(!(sessionId in playerlist)) {return;}
      var thisPlayer=playerlist[sessionId];
      var thisHost=hostlist[thisPlayer.hostid];

      thisPlayer.connected=1;
      //hostid,playername,isHost,isLocal
      socket.emit('playerstatusresponse',
        thisPlayer.hostid,
        thisPlayer.username,
        (thisHost.hostPlayer==sessionId),
        thisHost.isOnline,
        thisHost.playerlist,
        thisHost.gameStatus,
        thisHost.options,
        thisPlayer.personalPlaylist.length,
        thisHost.name,
        thisHost.password
      );
    });

    //When a host requests to create a hostid
    socket.on('hostidrequest', function(msg){
      var hostid = createHost();
      console.log("New host created at " + hostid);
      socket.emit('hostidresponse',hostid);
    });

    socket.on('login', function(username,password){
      accounts.login(username,password).then(function(account){
        if(account==null) {
          socket.emit('errormessage',"Incorrect credentials");
        }
        else {
          socket.emit('loginresponse',account.userSession);
        }
      });
    });

    socket.on('logout', function(userSession){
      accounts.logout(userSession);
    });

    socket.on('register', function(username,password){
      if (username.length<3 || username.length>20
        || password.length <5 || password.length >20) {
        socket.emit('errormessage', "Username/Password must be between 6-20 characters.");
      }
      if (username.indexOf('(')>=0) {
        socket.emit('errormessage', "Username may not contain parenthesis.");
      }
      else
      {
        accounts.register(username,password).then(function(account){
          if (account==null){
            socket.emit('errormessage',"An account with that name already exists!");
            return;
          }
          else {
            socket.emit('loginresponse',account.userSession);
          }
        });
      }
    });

    socket.on('getusername', function(thisUserSession){
      users.findOne({userSession: thisUserSession}).then(function(colldata, err){
        if(err) return;
        if(colldata!=null)
        {
          socket.emit('getusername',colldata.username,colldata.spotifyAccount,colldata.anilistAccount);
        }
      });
    });
    //Checks if a player has thier cookie set.
    socket.on('checkplayersession', function(msg){
      if(msg in playerlist)
        socket.emit('connectplayer', playerlist[msg].username,playerlist[msg].hostid,playerlist[msg].name);
      else socket.emit('playerconnectfailed');
    });

    socket.on('importanilistaccount',function(username,userSession) {
      accounts.checkUserSession(userSession).then(function(account){
        if (account==null) {
          socket.emit('errormessage',"Could not import account.");
        }
        else {
          anilist.getAnilist(username, account.username).then(function(username){
            socket.emit('importanilistresponse');
          });
        }
      });
    });

    socket.on('animesongrequest', function(userSession){
      accounts.checkUserSession(userSession).then(function(account) {
        var thisPlaylist = [];
        account.anilistPlaylist.forEach(function(data){
          thisPlaylist.push(data[0]);
        });
        //console.log(thisPlaylist);

        animeCollectionTest.find({idMal: { $in: thisPlaylist } }).toArray().then(function(doc) {
          //console.log(doc);
          if(doc)
            socket.emit('animesongresponse',doc);
        });
      });
    });

    socket.on('animesongupdate', function(doc){
      animeCollection.insert(doc);
      animeCollectionTest.deleteOne({ songid: doc.songid });
    });

    //When a user is requesting to get all the servers
    socket.on('serverrequest', function() {
      socket.emit('serverresponse', shortServerList());
    });

    socket.on('createserver', function(servername,password,sessionId,userSession,isOnline,presetId) {
      //Generate a hostid for a local game
      var hostid=md5(servername).slice(0,8);

      if(isOnline==0) {
        servername = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (var i = 0; i < 4; i++)
          servername += possible.charAt(Math.floor(Math.random() * possible.length));

        //Checks if a hostid exists, otherwise creates another one.
        while(servername in hostlist)
        {
          servername = "";
          for (var i = 0; i < 4; i++)
            servername += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        hostid=servername;
      }

      accounts.checkUserSession(userSession).then(function(account){
        if(isOnline==1 && servername.length<3 && account!=null){
          servername = account.username+"'s Game";
        }

        if (servername.length>25 || servername.length<3 ) {
          socket.emit('errormessage',"Server names must be between 3-25 characters")
        }

        else if(hostid in hostlist) {
          //If such a server already exists
          socket.emit('errormessage',"A server with that name already exists")
        }

        else {
          //Creates the server and player variables
          presetCollection.findOne({id: presetId}).then(preset => {
            var thisServer = new Host(hostid, servername, preset);
            hostlist[hostid] = thisServer;

            var thisPlayer;
            if(account==null){
              thisServer.connectedplayers++;
              thisPlayer = new Player(("(Host)"),hostid,sessionId);
            }
            else {
              thisServer.connectedplayers++;
              thisPlayer = new Player(account.username,hostid,sessionId);
              thisPlayer.userSession=userSession;
            }
            playerlist[sessionId]=thisPlayer;

            thisServer.hostPlayer=sessionId;
            if(isOnline==1) thisServer.playerlist.push(thisPlayer);
            thisServer.password=password;
            thisServer.isOnline=isOnline;
            publicserverlist.push(thisServer);

            //playlists.importSpotifyPlaylists(hostlist[hostid]);
            socket.emit('createserverresponse');
            io.of('/servers').emit('updateserverlist', shortServerList());
          });
        }
      });

    });

    socket.on('changename', function(sessionId,newName) {
      try {
        if(sessionId in playerlist) {
          playerlist[sessionId].username=newName;
          io.of('/'+playerlist[sessionId].hostid).emit('sendPlayerList',hostlist[playerlist[sessionId].hostid].playerlist);
        }
      } catch (err) {console.log(err);}
    });

    socket.on('settingsDOMrequest', function(sessionId,hostid){
      if(hostid in hostlist){
        if(hostlist[hostid].hostPlayer!=sessionId) return;
        socket.emit('settingsDOMresponse',hostlist[hostid].options);
      }
    });

    //Closes a host so that a game can begin.
    socket.on('closehost', function(sessionId, hostid){
      if(hostid in hostlist){
        if(hostlist[hostid].hostPlayer!=sessionId) return;

        //Closes the server to the public
        console.log("Game beginning on "+hostid);
        importAndStart();

        async function importAndStart() {
          //Sets the collection that the game will be using, and creates the personal playlists
          if(hostlist[hostid].options.mode == 'anime-mode') {
            hostlist[hostid].collection=animeCollection;
            await playlists.importAnilistPlaylists(hostlist[hostid]);
          }
          if(hostlist[hostid].options.mode=='music-mode') {
            hostlist[hostid].collection=songCollection;
            await playlists.importSpotifyPlaylists(hostlist[hostid]);
          }

          //Generates the playlist for the game
          var theseOptions = hostlist[hostid].options;
          if (theseOptions.importMode=="full")
          {
            playlists.createFullPlaylist(hostlist[hostid]);
          }
          if (theseOptions.importMode=="balanced")
          {
            playlists.createBalancedPlaylist(hostlist[hostid]);
          }
          if (theseOptions.importMode=="shared")
          {
            playlists.createSharedPlaylist(hostlist[hostid]);
          }

          generateQuery(hostid);

          //Checks the query and ensures that there enough songs for a full game
          var newQuery = [];
          var fail = 0;
          newQuery.push({ $count: "myCount" });
          var query = hostlist[hostid].query.concat(newQuery);
          var songDB = hostlist[hostid].collection.aggregate(query).each(function(err, doc) {
            if(doc) {
              console.log(doc.myCount);
              if(doc.myCount<theseOptions.songs) {
                socket.emit('errormessage', "Couldn't find enough songs to fit the settings.");
              }
              else {
                hostlist[hostid].alreadyPlayed = [];
                hostlist[hostid].round=0;
                hostlist[hostid].canjoin=0;
                hostlist[hostid].gameStatus='setup';
                io.of('/servers').emit('updateserverlist', shortServerList());

                beginPlaying(hostid,hostlist[hostid].timeStarted);
                fail=1;
              }
            }
            else if (fail==0) {
              socket.emit('errormessage', "Couldn't find enough songs to fit the settings.");
              fail=1;
            }
            if(err) {
              console.log(err);
              socket.emit('errormessage', "Error when processing the playlist.");
            }
          });
        }
      }
    });

    //Adds a song from a user
    socket.on('addmusic', function(name,url,tags,coverart,type){
      var song = {
        name: name,
        url: url,
        tags: tags,
        coverart: coverart,
        type: type};
      songCollection.insertOne(song, function(err, res) {
        if (err) throw err;
      });
    });

    //Checks the text field and sends possible titles
    socket.on('checktext', function(hostid,msg){
      if(hostid in hostlist)
      {
          if(hostoptions.matchBy!='player') {
          hostoptions=hostlist[hostid].options;
          var query = {name: {'$regex': msg, "$options": 'i' }};
          if (hostoptions.matchBy=="album")
            query = {album: {'$regex': msg, "$options": 'i' }};
          if (hostoptions.matchBy=="artist")
            query = {artist: {'$regex': msg, "$options": 'i' }};
          if (hostoptions.matchBy=="series")
            query = {series: {'$regex': msg, "$options": 'i' }};

          hostlist[hostid].collection.find(query).sort({popularity: -1}).toArray().then(function(count){
            var output=[]
            var i=0;
            if (hostoptions.matchBy=="title")
            {
              var values = Array.prototype.map.call(count, function(obj) {
                return obj.name;
              });
              var output = Array.from(new Set(values))
              output=output.slice(0,5);
            }
            if (hostoptions.matchBy=="album")
            {
              var values = Array.prototype.map.call(count, function(obj) {
                return obj.album;
              });
              var output = Array.from(new Set(values))
              output=output.slice(0,5);
            }
            if (hostoptions.matchBy=="artist")
            {
              var values = Array.prototype.map.call(count, function(obj) {
                return obj.artist;
              });
              var output = Array.from(new Set(values))
              output=output.slice(0,5);
            }
            if (hostoptions.matchBy=="series")
            {
              var values = Array.prototype.map.call(count, function(obj) {
                return obj.series;
              });
              var output = Array.from(new Set(values))
              output=output.slice(0,5);
            }

            socket.emit("possibleresults",output,msg);
          });
        }
        //If we are sorting by playernames
        else {
          var thesePlayers=hostlist[hostid].playerlist;
          var output = [];
          thesePlayers.forEach(function(player){
            if (player.username.toLowerCase().includes(msg.toLowerCase()) && output.length<6) {
              output.push(player.username);
            }
          });
          socket.emit("possibleresults",output,msg);
        }
      }
    });

    socket.on('savesettings', function(sessionId, hostid, options){
      if(hostid in hostlist)
      {
        presetCollection.findOne({id: options.presetId}).then(preset => {
          if(preset == null) hostlist[hostid].preset = {name: "Custom", options: undefined};
          else if(!(_.isEqual(preset.options, options))) {
            console.log(preset.options);
            console.log(options);
            hostlist[hostid].preset = {name: "Custom", options: undefined};
          }
          else hostlist[hostid].preset = preset;

          if(hostlist[hostid].hostPlayer!=sessionId) return;
          var host=hostlist[hostid];
          //If the host chose to allow spotify
          io.of('/'+hostid).emit('updateSettings',options);
          io.of('/servers').emit('updateserverlist', shortServerList());
          hostlist[hostid].options=options;
        });
      }
    });

    socket.on('chat message', function(sessionId,hostid,msg){
      if(!(hostid in hostlist)) return;
      if(!(sessionId in playerlist)) return;
      if(playerlist[sessionId].hostid!=hostid) return;
      io.of('/'+hostid).emit('chat message', playerlist[sessionId].username, msg);
    });

    socket.on('heartbeat', function(sessionId){
      if(sessionId in playerlist)
      {
        playerlist[sessionId].lastBeat=Date.now();
        if (playerlist[sessionId].hostid in hostlist)
          hostlist[playerlist[sessionId].hostid].lastBeat = Date.now();
      }
    });

    socket.on('reopenhost', function(sessionId, hostid){
      if(!(hostid in hostlist)) return;
      if(hostlist[hostid].hostPlayer != sessionId) return;
      hostlist[hostid].playerlist.forEach(function(player){
        player.score=0;
      });
      io.of('/'+hostid).emit('reopenhost', getPlayerList(hostid) );
      hostlist[hostid].canjoin=1;
      io.of('/servers').emit('updateserverlist', shortServerList());
    });

    socket.on('joinserverrequest', function(sessionId,userSession,hostid,password) {
      if(!(hostid in hostlist)) {
        console.log(hostlist);
        socket.emit('errormessage',"That server does not exist.");
        return;
      }
      if(hostlist[hostid].password!=password) {
        socket.emit('errormessage',"The password is incorrect.");
        return;
      }
      if(hostlist[hostid].playerlist.length>=32) {
        socket.emit('errormessage',"That server is full.");
        return;
      }
      if(hostlist[hostid].canjoin==0) {
        socket.emit('errormessage',"That server is closed.");
        return;
      }

      accounts.checkUserSession(userSession).then(function(account){
        var thisServer = hostlist[hostid];

        var thisPlayer;
        if(account==null){
          thisServer.connectedplayers++;
          thisPlayer = new Player((generateGuestName(thisServer.playerlist,'Guest')),hostid,sessionId);
        }
        else {
          thisServer.connectedplayers++;
          thisPlayer = new Player(account.username,hostid,sessionId);
          thisPlayer.userSession=userSession;
        }

        playerlist[sessionId]=thisPlayer;

        thisServer.playerlist.push(thisPlayer);

        socket.emit('joinserverresponse');
        io.of('/'+hostid).emit('consolemessage', (thisPlayer.username+ " joined the game."));
        io.of('/'+hostid).emit('sendPlayerList',getPlayerList(hostid));
        io.of('/servers').emit('updateserverlist', shortServerList());
      });
    });

    function getPresets(userSession) {
      return new Promise(resolve => {
        accounts.checkUserSession(userSession).then(account => {
          var presets = [];
          presetCollection.find({id: {$in: ['1','2','3']}}).toArray().then(defaultPresets => {
            presets.push(defaultPresets);
            if (account == null) {
              presets.push([]);
              resolve(presets);
            }
            else{
              presetCollection.find({owner:account.username}).toArray().then(userPresets => {
                presets.push(userPresets);
                resolve(presets);
              });
            }
          });
        });
      });
    }

    socket.on('presetrequest', function(userSession){
      getPresets(userSession).then(presets => {
        socket.emit('presetresponse',presets);
      });
    });

    socket.on('getpreset', function(presetId,userSession){
      accounts.checkUserSession(userSession).then(account => {
        presetCollection.findOne({id:presetId}).then(preset => {
          if (preset==null) return;
          var isOwner=false;
          if(account!=null){
            if(account.username == preset.owner){
              isOwner = true;
            }
          }
          socket.emit('getpresetresponse', JSON.parse(preset.options), isOwner)
        });
      })

    });

    socket.on('savepreset', function(presetOptions,presetId,presetName,userSession){
      if(presetName.length<2 || presetName.length > 20) {
        socket.emit('errormessage','Enter a valid name for your preset');
        return;
      }
      accounts.checkUserSession(userSession).then(account => {
        if (account==null) return;
        if(presetId=='create') {
          presetCollection.findOne({name:presetName, owner:account.username}).then(checkPreset => {
            if(checkPreset!=null){
              socket.emit('errormessage','A preset already exists with that name.');
              return;
            }

            createPresetId().then(newId => {
              presetOptions.presetId=newId;
              var preset = {
                name: presetName,
                id: newId,
                options: JSON.stringify(presetOptions),
                owner: account.username
              };
              presetCollection.save(preset);
              presetCollection.find({owner:account.username}).toArray().then(presets => {
                getPresets(userSession).then(presets => {
                  socket.emit('presetresponse',presets);
                });
                socket.emit('consolemessage','Preset saved');
              });
            });
          });
        }
        else{
          presetCollection.findOne({id:presetId, owner:account.username}).then(preset => {
            if (preset==null) return;
            preset.name = presetName;
            preset.options= JSON.stringify(presetOptions),
            presetCollection.save(preset);
            presetCollection.find({owner:account.username}).toArray().then(presets => {
              getPresets(userSession).then(presets => {
                socket.emit('presetsavedresponse',presets,preset.id);
              });
              socket.emit('consolemessage','Preset saved');
            });
          });
        }

        function createPresetId(){
          return new Promise(resolve => {
            var newId = '';
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < 15; i++)
              newId += possible.charAt(Math.floor(Math.random() * possible.length));

            //Checks if the id exists
            presetCollection.findOne({id:newId}).then(preset => {
              if (preset == null) {
                resolve(newId);
              }
              else{
                createPresetId().then(newerId => {
                  resolve(newerId);
                });
              }
            });
          });
        }
      });
    });

    socket.on('savepresetdescription', function(userSession,presetId,newDescription){
      accounts.checkUserSession(userSession).then(account => {
        if(account == null) return;
        presetCollection.findOne({id:presetId}).then(preset => {
          if(preset==null) return;
          if(preset.owner == account.username) {
            preset.description = newDescription;
            presetCollection.save(preset);
          }
        });
      });
    });

    socket.on('deletepreset', function(userSession,presetId){
      accounts.checkUserSession(userSession).then(account => {
        if(account == null) return;
        presetCollection.findOne({id:presetId}).then(preset => {
          if(preset==null) return;
          if(preset.owner == account.username) {
            presetCollection.remove({id: presetId});
          }
        });
      });
    });
    //Sends a response to the server
    socket.on('guess', function(guess,sessionId,hostid) {
      //Check is the player's guess is in the array
      if(hostid in hostlist) {
        if(hostoptions.matchBy!='player') {
          if (hostlist[hostid].possibleTitles.indexOf(guess)>=0) {
            //Increment a player's score
            var thisPlayer = playerlist[sessionId];
            thisPlayer.score++;
            io.of('/'+hostid).emit('scoreplayer',thisPlayer.username,guess,1);
          } else {io.of('/'+hostid).emit('scoreplayer',playerlist[sessionId].username,guess,0);}
        }

        //If the host is scoring by player
        else {
          var success=0;

          hostlist[hostid].playerlist.forEach(function(player){
            try{
              if (player.username.toLowerCase()==guess.toLowerCase()) {
                console.log(hostlist[hostid].currentSong);

                if (player.personalPlaylist.indexOf(hostlist[hostid].currentSong)>0) {
                  success=1;
                }
              }
            } catch(err){console.log(err);}
          });
          var thisPlayer = playerlist[sessionId];
          playerlist[sessionId].score+=success;
          io.of('/'+hostid).emit('scoreplayer',thisPlayer.username,guess,success);
        }
      }
    });
  });

  function getPlayerList(hostid) {
    var returnPlayerList = [];
    hostlist[hostid].playerlist.forEach(function(player){
      var playerToAdd = {
        username: player.username,
        score: player.score
      };
      returnPlayerList.push(playerToAdd);
    });

    return returnPlayerList;
  }



  //List of all the hosts and their sockets
  //var socketMap = {};

  /*******************************************
  *         HOST/PLAYER INFORMATION          *
  *******************************************/

  //Defines a single player
  function Player(username, hostid, sessionId){
    this.username=username;
    this.hostid=hostid;
    this.sessionId=sessionId;
    this.userSession=undefined;
    this.spotifyAccount=undefined;
    this.personalPlaylist = [];
    this.lastBeat=Date.now();
    this.score=0;
  }

  //Defines the host of a game
  function Host(hostid, serverName, thisPreset){
    this.password=undefined;
    this.isOnline=0;
    this.hostid=hostid;
    this.name=serverName;
    this.hostPlayer = undefined;
    this.playerlist = new Array();
    this.alreadyPlayed = [];

    this.connectedplayers=0;
    this.canjoin=1;
    this.lastBeat=Date.now();
    this.timeStarted=Date.now();

    this.gameStatus='setup';
    this.round=0;
    this.currentSong=undefined;
    this.possibleTitles=[];

    this.playlist=[];
    this.collection=undefined;
    this.query=[];
    this.hasPlaylist=this.playlist.length;

    this.preset = thisPreset;

    this.options=JSON.parse(thisPreset.options);

    var thisHost = io.of('/'+hostid);
    thisHost.on('connection', function(socket){
      console.log('someone connected to ' +hostid);
    });
  }

  function shortServerList(){
    var serverinfo = [];
    publicserverlist.forEach(function(server){
      if(server.isOnline==1){
        serverinfo.push({
          hostid: server.hostid,
          name: server.name,
          size: server.playerlist.length,
          noPassword: (server.password=='' || server.password==undefined),
          preset: server.preset.name,
          canJoin: server.canjoin
        });
      }
    });
    return serverinfo;
  }

  //Dictionary where the key is the hostid and the value is the host
  var hostlist = {};
  var playerlist = {};
  var publicserverlist = [];

  function beginPlaying(hostid,timeStarted) {
    hostlist[hostid].playerlist.forEach(function(player){
      player.score=0;
    });
    nextRound();

    function nextRound() {
      try{
        if (hostid in hostlist) {
          //Check that this isn't a different game with the same hostid
          if (hostlist[hostid].timeStarted==timeStarted)
          {
            if (hostlist[hostid].round < hostlist[hostid].options.songs)
            {
              hostlist[hostid].gameStatus='playing';
              pickSong(hostid);
              setTimeout(function() {
                if (hostid in hostlist)
                {
                  if (hostlist[hostid].timeStarted==timeStarted)
                  {
                    hostlist[hostid].gameStatus='scoring';
                    var playerPlaylists = [];
                    hostlist[hostid].playerlist.forEach(function(player){
                      if(player.personalPlaylist.indexOf(hostlist[hostid].currentSong)>=0) {
                        playerPlaylists.push(player.username);
                      }
                    });

                    io.of('/'+hostid).emit('finishedround',playerPlaylists);
                  }
                }

              }, (hostlist[hostid].options.length*1000));
              setTimeout(function()
              {
                if (hostid in hostlist)
                {
                  if (hostlist[hostid].timeStarted==timeStarted)
                  {
                    nextRound();
                  }
                }
              }, ((hostlist[hostid].options.length*1000)+10000));
            }

            //If the round is over
            else {
              io.of('/'+hostid).emit('endgame',getPlayerList(hostid));
              hostlist[hostid].canjoin=1;
              hostlist[hostid].gameStatus='setup';
            }
          }
        }
      } catch (err) {console.log(err);}
    }
  }

  /*******************************************
  *          SONG/VIDEO INFORMATION          *
  *******************************************/

  //Picks a song and sends it
  function pickSong(hostid) {
    if((!hostid in hostlist)) {
      return;
    }
    hostlist[hostid].round++;
    var theseOptions = hostlist[hostid].options;
    generateQuery(hostid);
    var newQuery = [];
    newQuery.push({ $sample: { size: 1 } });
    var query = hostlist[hostid].query.concat(newQuery);
    var songDB = hostlist[hostid].collection.aggregate(query).each(function(err, doc) {
      if(doc) {
        console.log(doc);
        console.log(hostlist[hostid].playlist.indexOf(doc.songid));
        hostoptions=hostlist[hostid].options;
        hostlist[hostid].currentSong = doc.songid;
        hostlist[hostid].possibleTitles = [];

        if(hostoptions.matchBy=="title"){
          hostlist[hostid].possibleTitles.push(doc.name);
          if(doc.alternateTitles != undefined) {
            if(doc.alternateTitles.length >0 ) {
              doc.alternateTitles.forEach(function(title){
                hostlist[hostid].possibleTitles.push(title);
              });
            }
          }
        }

        if(hostoptions.matchBy=="album"){
          hostlist[hostid].possibleTitles.push(doc.album);
          if(doc.alternateAlbums != undefined) {
            if(doc.alternateAlbums.length >0 ) {
              doc.alternateAlbums.forEach(function(title){
                hostlist[hostid].possibleTitles.push(title);
              });
            }
          }
        }

        if(hostoptions.matchBy=="artist")
          hostlist[hostid].possibleTitles.push(doc.artist);

        if(hostoptions.matchBy=="series"){
          hostlist[hostid].possibleTitles=doc.alternateNames;
          hostlist[hostid].possibleTitles.push(doc.series);
        }

        if(hostoptions.matchBy=="player"){
          hostlist[hostid].possibleTitles.push(doc.songid);
          if(doc.alternateIds != undefined) {
            if(doc.alternateIds.length >0 ) {
              doc.alternateIds.forEach(function(title){
                hostlist[hostid].possibleTitles.push(title);
              });
            }
          }
        }

        if (hostoptions.mode=='music-mode'){
          hostlist[hostid].currentSong = doc.songid;
          hostlist[hostid].alreadyPlayed.push(doc.songid);
          io.of('/'+hostid).emit(
            'roundstart',
            [doc.name],
            [doc.album],
            [doc.artist],
            doc.coverart,
            doc.url,
            doc.type,
            hostlist[hostid].round,
            getPlayerList(hostid),
            hostlist[hostid].options.length
          );
        }

        if (hostoptions.mode=='anime-mode') {
        hostlist[hostid].currentSong = doc.idMal;
        hostlist[hostid].alreadyPlayed.push(doc.songid);
          io.of('/'+hostid).emit(
            'roundstart',
            [doc.series],
            [doc.name],
            [doc.artist],
            doc.coverart,
            doc.url,
            doc.type,
            hostlist[hostid].round,
            getPlayerList(hostid),
            hostlist[hostid].options.length
          );
        }
      }
    });
  }

  function generateQuery(hostid) {
    //Sets the query for the game
    hostlist[hostid].query = [];
    var theseOptions = hostlist[hostid].options;
    var query = hostlist[hostid].query;

    //Music Mode
    if (hostlist[hostid].options.mode=='music-mode') {
      if (hostlist[hostid].options.importFromSpotify==true && hostlist[hostid].playlist.length > 0)
      {
        query.push({
            $match: {
              songid: {$in: hostlist[hostid].playlist},
              tags: {$in: hostlist[hostid].options.tags},
              $and: [
                { songid: { $not: { $in: hostlist[hostid].alreadyPlayed} } },
                { songid: { $not: { $eq: "dupe"} } },
                { year: { $gte: theseOptions.ageMin } },
                { year: { $lte:  theseOptions.ageMax } },
                { popularity: { $gte: theseOptions.difficultyMin } },
                { popularity: { $lte: theseOptions.difficultyMax } }
              ]
            }
          });
      }

      else {
        query.push({
            $match: {
              tags: {$in: hostlist[hostid].options.tags},
              $and: [
                { songid: { $not: { $eq: "dupe"} } },
                { songid: { $not: { $in: hostlist[hostid].alreadyPlayed} } },
                { year: { $gte: theseOptions.ageMin } },
                { year: { $lte:  theseOptions.ageMax } },
                { popularity: { $gte: theseOptions.difficultyMin } },
                { popularity: { $lte: theseOptions.difficultyMax } }
              ]
            }
          });
      }
    }

    //Anime Mode
    if (hostlist[hostid].options.mode=='anime-mode') {
      var oped = [];
      if (hostlist[hostid].options.oped == 'openings') {oped=[false];}
      if (hostlist[hostid].options.oped == 'endings') {oped=[true];}
      if (hostlist[hostid].options.oped == 'both') {oped=[true,false];}
      if (hostlist[hostid].options.importFromAnilist==true && hostlist[hostid].playlist.length > 0)
      {
        query.push({
            $match: {
              tags: {$in: hostlist[hostid].options.tags},
              $and: [
                { idMal: {$in: hostlist[hostid].playlist} },
                { ending: {$in: oped} },
                { songid: { $not: { $eq: "dupe"} } },
                { songid: { $not: { $in: hostlist[hostid].alreadyPlayed} } },
                { year: { $gte: theseOptions.ageMin } },
                { year: { $lte:  theseOptions.ageMax } },
                { popularity: { $gte: theseOptions.difficultyMin } },
                { popularity: { $lte: theseOptions.difficultyMax } },
                { averageScore: { $gte: theseOptions.avgScoreMin } },
                { averageScore: { $lte: theseOptions.avgScoreMax } }
              ]
            }
          });
      }

      else {
        query.push({
            $match: {
              tags: {$in: hostlist[hostid].options.tags},
              $and: [
                { ending: {$in: oped} },
                { songid: { $not: { $eq: "dupe"} }},
                { songid: { $not: { $in: hostlist[hostid].alreadyPlayed} } },
                { year: { $gte: theseOptions.ageMin } },
                { year: { $lte:  theseOptions.ageMax } },
                { popularity: { $gte: theseOptions.difficultyMin } },
                { popularity: { $lte: theseOptions.difficultyMax } },
                { averageScore: { $gte: theseOptions.avgScoreMin } },
                { averageScore: { $lte: theseOptions.avgScoreMax } }
              ]
            }
          });
      }
    }
    if(theseOptions.customQuery!=undefined) {
      query.push(theseOptions.customQuery);
    }
  }

  /*******************************************
  *               DISCONNECTING              *
  *******************************************/

  //Remove players on an interval
  setInterval(function() {
    for(var playerid in playerlist) {
      //If the player is null for some reason
      if (playerlist[playerid]==undefined) {
        console.log('removeplayer',(Date.now() - playerlist[playerid].lastBeat));
        removePlayer(playerid);
      }

      //If the player has been inactive for too long
      else if ((Date.now() - playerlist[playerid].lastBeat > 10000)) {
        console.log('removeplayer',(Date.now() - playerlist[playerid].lastBeat));
        removePlayer(playerid);
      }
    }

    for(var hostid in hostlist) {
      if (hostlist[hostid]==undefined) {
        removeServer(hostid);
      }

      else if ((Date.now() - hostlist[hostid].lastBeat > 10000)) {
        console.log('removehost',(Date.now() - hostlist[hostid].lastBeat));
        removeServer(hostid);
      }
    }
  }, 500);

  function removePlayer(sessionId) {
    try{
      if (!(sessionId in playerlist)) {
        return;
      }



      if ((playerlist[sessionId].hostid in hostlist)) {
        var thisPlayer = playerlist[sessionId];
        io.of('/'+thisPlayer.hostid).emit('consoleMessage', (thisPlayer.username+ " left the game."));

        var thisHost=hostlist[thisPlayer.hostid];
        var newPlayerList = [];
        for(var i=0; i<thisHost.playerlist.length; i++)
        {
          //Checks if a users sessionId is equal to the one that is disconnecting
          if(thisHost.playerlist[i].sessionId != sessionId)
            newPlayerList.push(thisHost.playerlist[i]);
        }
        thisHost.playerlist = newPlayerList;

        //Changes the hostPlayer
        if (newPlayerList.length>0 && thisHost.isOnline==1)
        {
          thisHost.hostPlayer = newPlayerList[0].sessionId;
          io.of('/'+playerlist[sessionId].hostid).emit('changehost', thisHost.hostPlayer);
        }
        io.of('/'+playerlist[sessionId].hostid).emit('sendPlayerList', getPlayerList(playerlist[sessionId].hostid));
      }



      delete playerlist[sessionId];
      io.of('/servers').emit('updateserverlist', shortServerList());
    } catch (err) {}

  }

  function removeServer(hostid) {
    if (!(hostid in hostlist)) {
      return;
    }

    var newServerList = [];
    //Updates the publicserverlist
    for(var i=0; i<publicserverlist.length; i++)
    {
      if(publicserverlist[i].hostid != hostid)
        newServerList.push(publicserverlist[i]);
    }
    publicserverlist = newServerList;
    io.of('/'+hostid).emit('removeserver');
    delete hostlist[hostid];
    io.of('/servers').emit('updateserverlist', shortServerList());
  }


/*  process.on( 'SIGINT', function() {
    console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
    for (let key in hostlist) {
      let value = hostlist[key];
      //console.log(value);
      value.playlist.drop(function(err, delOK) {
        if (err) console.log("Error");
        if (delOK) console.log("Collection deleted");
      });
    }
    setTimeout(function(){
      process.exit()
    },2000);
  });
  */
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

function generateGuestName(thisPlayerlist, name) {
  var keepTrying=true;
  var count = 1;
  var guestName = name + ' ('+count+')';
  while(keepTrying) {
    guestName = name + ' ('+count+')';
    keepTrying=false;
    thisPlayerlist.forEach(player => {
      var thisName = player.username;
      if(thisName == guestName) {
        count++;
        keepTrying = true;
      }
    });
  }
  return guestName;
}
