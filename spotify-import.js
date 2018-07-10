const baseUrl="https://www.shamradio.com";
var SpotifyWebApi = require('spotify-web-api-node');
var MongoClient = require('mongodb').MongoClient;
var configs = require('./configs.js');
var url = configs.getMongoURL();
var spotifyApi = new SpotifyWebApi({
  clientId: '6d404988dbe84c42b2ffb44735ac6ab0',
  clientSecret: '375e583219334d4aa329727ee2cee6ea',
  redirectUri: baseUrl+'/spotify'
});
var db;
var users;
var songCollection;

MongoClient.connect(url, function(err, dbo) {
  db = dbo.db("shamradio");
  users = db.collection("Users");
  songCollection = db.collection("Songlist")
});

var lastfm = require('./lastfm-import.js');

module.exports = {
    addUser: addUser,
    addSongFromSpotify: addSongFromSpotify,
    updateUser: updateUser,
    getTopPlaylists: getTopPlaylists
};

// Retrieve an access token
spotifyApi.clientCredentialsGrant().then(
  function(data) {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);


    setInterval(function() {
      spotifyApi.refreshAccessToken().then(
        function(data) {
          console.log("Refreshed token");
        },
        function(err) {
          console.log('Could not refresh the token!', err.message);
        });
    },(data.body['expires_in']*990));

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
    //getTopPlaylists();
  },
  function(err) {
    console.log(
      'Something went wrong when retrieving an access token',
      err.message
    );
  }
);
//Refresh the access access_token

function addUser(thisUserSession, code) {
  users.findOne({userSession: thisUserSession}).then(function(user){
    if (user==undefined) return;
    var thisSpotifyToken = {
      token: undefined,
      expiration: undefined,
      refresh: code
    }
    user.spotifyToken = thisSpotifyToken;
    user.spotifyPlaylist = [];
    users.save(user);
    spotifyImportStack.push([user.username,0]);
  });
}

function updateUser(username) {
  users.findOne({username: thisUsername}).then(function(user){});
  if (user==undefined) return;
  spotifyImportStack.push([thisUsername,0]);
}

function checkAccessToken(user) {
  return new Promise(resolve =>{
    var newToken=false;

    //If the user has no token
    if(user.spotifyToken==undefined) {
      return;
    }
    //If the user has a token
    else {
      //If the token has never been generated
      if(user.spotifyToken.token==undefined && user.spotifyToken.refresh != undefined) {
        newToken=true;
      }
      //If the token has expired
      else if(user.spotifyToken.expiration < (Date.now())) {
        newToken=true;
      }
      //If the token is still valid
      else resolve();
    }

    if(newToken) {
      spotifyApi.authorizationCodeGrant(user.spotifyToken.refresh).then(function(data) {
        //Create a new token for the user
        var thisSpotifyToken = {
          token: data.body.access_token,
          expiration: (Date.now()+data.body.expires_in*1000),
          refresh: data.body.refresh_token
        }
        user.spotifyToken=thisSpotifyToken;
        spotifyApi.setAccessToken(data.body.access_token);
        return spotifyApi.getMe();
      }).then(function(data) {
        //Get the username for the account
        user.spotifyAccount = data.body.id;
        users.save(user);
        resolve();
      }).catch(function(err) {
        resolve();
      });
    }
  });
}

function saveTrack(thisUsername,track) {
  users.findOne({username: thisUsername}).then(function(user){
    if(user==undefined) return;

    //Checks/Updates the user's token
    checkAccessToken(user).then(function(){
      spotifyApi.setAccessToken(user.spotifyToken.token);
      spotifyApi.addToMySavedTracks(track);
    });
  });
}

function getSavedTracks(thisUsername, thisOffset) {
  users.findOne({username: thisUsername}).then(function(user){
    if(user==undefined) return;

    //Checks/Updates the user's token
    checkAccessToken(user).then(function(){
      spotifyApi.setAccessToken(user.spotifyToken.token);
      spotifyApi.getMySavedTracks({limit: 25, offset: thisOffset}).then(function(data, err) {
        if(err){
          console.log("Something went wrong :"+err);
        }
        if (data==undefined) return;
        if (data.body.items==undefined) return;
        data.body.items.forEach(function(track){
          //Checks if the song is in the collection
          songCollection.findOne({songid: ("spfy#"+track.track.id)}).then(function(colldata, err){
            if (err) console.log(err);
            if(colldata==null) {
              songImportStack.push(track.track);
            }
          });
          user.spotifyPlaylist.push("spfy#"+track.track.id);
        });
        users.save(user);
        //Keep adding until the users collection is full
        if(data.body.items.length==25) {
          spotifyImportStack.push([thisUsername, thisOffset+25]);
        }
      });
    });
  });
}

function getTopTracks(thisUsername, offset) {
  spotifyApi.getMyTopTracks({limit: 20, offset: 0}).then(function(data, err) {
    if(err){
      console.log("Something went wrong :"+err);
    }
    //console.log(data.body.items);
    data.body.items.forEach(function(track){
      let thisSongid="spfy#"+track.id;
      if(track.preview_url!=null)
      {
        //Checks if the song is in the collection
        songCollection.findOne({songid: thisSongid}).then(function(colldata, err){
          if (err) console.log(err);
          if(colldata==null) {
            addSongFromSpotify(track);
          }
        });
      }
      playerlist[sessionId].personalPlaylist.push("spfy#"+track.id);
    });
    if(offset<200 && data.body.items.length==20) {
      setTimeout(function(){getTopTracks(offset+20)},100);
    }
  });
}

function addSongFromSpotify(song) {
  if(song.preview_url!=null) {
    //Adds a new song
    var alternateArtists = [];
    song.artists.forEach(function(artist){
      alternateArtists.push(artist.name);
    });

    var song = {
      songid: ("spfy#"+song.id),
      name: song.name,
      album: song.album.name,
      artist: song.artists[0].name,
      coverart: song.album.images[0].url,
      url: song.preview_url,
      popularity: song.popularity,
      year: parseInt(song.album.release_date.split('-')[0]),
      tags: "Music",
      type: "audio",
      alternateTitles: [],
      alternateAlbums: [],
      alternateArtists: [alternateArtists],
      alternateIds: [],
      wins: 1.0,
      losses: 1.0,
      ratio: 1.0,
    };
    //findDuplicateSongs(song);
    lastfm.updateSong(song);
  }
}

function getTopPlaylists() {
  spotifyApi.getFeaturedPlaylists({limit: 50, offset: 0}).then(data => {
    data.body.playlists.items.forEach(playlist => {
      spotifyPlaylistStack.push([playlist.id,0]);
    });
  });
}

function addSongsFromPlaylist(id, offset) {
  spotifyApi.getPlaylistTracks('spotify',id,{limit: 25, offset: offset}).then(data => {
    if (data==undefined) return;
    if (data.body.items==undefined) return;
    data.body.items.forEach(function(track){
      //Checks if the song is in the collection
      songCollection.findOne({songid: ("spfy#"+track.track.id)}).then(function(colldata, err){
        if (err) console.log(err);
        if(colldata==null) {
          songImportStack.push(track.track);
        }
      });
    });

    if(data.body.items.length==25)
      spotifyPlaylistStack.push([id,offset+25]);
  });
}

var spotifyImportStack = [];
var spotifyPlaylistStack = [];
var songImportStack = [];

//Imports from Spotify
setInterval(function(){
  if(spotifyImportStack.length>0){
    var thisPerson = spotifyImportStack.pop();
    getSavedTracks(thisPerson[0],thisPerson[1]);
  }
  if(spotifyPlaylistStack.length>0){
    var thisPlaylist = spotifyPlaylistStack.pop();
    addSongsFromPlaylist(thisPlaylist[0],thisPlaylist[1]);
  }
},1000);

setInterval(function(){
  if(songImportStack.length>0){
    addSongFromSpotify(songImportStack.pop());
  }
},500);
