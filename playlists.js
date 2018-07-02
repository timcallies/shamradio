var accounts = require('./accounts.js');

module.exports = {
    importSpotifyPlaylists: importSpotifyPlaylists,
    importAnilistPlaylists: importAnilistPlaylists,
    createFullPlaylist: createFullPlaylist,
    createBalancedPlaylist: createBalancedPlaylist,
    createSharedPlaylist: createSharedPlaylist
};

function importSpotifyPlaylists(host){
  return new Promise(resolve => {
    var index = 0;
    keepLooping();

    //Repeatedly makes calls for the promise
    function keepLooping(){
      importOne(host.playerlist[index]).then(function(data) {
        index++;
        if(index < host.playerlist.length) {
          keepLooping();
        }
        else resolve();
      });
    }
  });


  //Imports a single player
  function importOne(player) {
    return new Promise((resolve,reject) => {
      player.personalPlaylist=[];
      accounts.checkUserSession(player.userSession).then(function(account){
        if (account!=null){
          if (account.spotifyAccount!=undefined){
            account.spotifyPlaylist.forEach(function(song) {
              player.personalPlaylist.push(song);
            });
          }
        }
        resolve();
      });
    });
  }
}

function importAnilistPlaylists(host){
  return new Promise(resolve => {
    var index = 0;
    keepLooping();

    //Repeatedly makes calls for the promise
    function keepLooping(){
      importOne(host.playerlist[index]).then(function(data) {
        index++;
        if(index < host.playerlist.length) {
          keepLooping();
        }
        else resolve();
      });
    }
  });


  //Imports a single player
  function importOne(player) {
    return new Promise((resolve,reject) => {
      player.personalPlaylist=[];
      accounts.checkUserSession(player.userSession).then(function(account){
        if (account!=null){
          if (account.anilistAccount!=undefined){
            account.anilistPlaylist.forEach(function(song) {
              if(song[1]>=host.options.scoreMin && song[1] <= host.options.scoreMax) {
                player.personalPlaylist.push(song[0]);
              }
            });
          }
        }
        resolve();
      });
    });
  }
}

function createFullPlaylist(host){
  host.playlist = [];
  host.playerlist.forEach(function(player){
    player.personalPlaylist.forEach(function(song){
      host.playlist.push(song);
    });
  });
  console.log(host.playlist);
}

function createBalancedPlaylist(host){
  //[0] = player, [1] = score, [2] = index, [3] = lookups
  var playerRotation = [];
  var keepSearching = true;
  host.playlist = [];

  //Creates the player rotation and lookups
  host.playerlist.forEach(function(thisPlayer){
    if (thisPlayer.personalPlaylist.length>0){
      let thisLookup = {};
      thisPlayer.personalPlaylist.forEach(function(song){
        thisLookup[song] = 1;
      });
      playerRotation.push({
        playlist: thisPlayer.personalPlaylist,
        score: 0,
        index: 0,
        lookup: thisLookup
      });
    }
  });

  if (playerRotation.length>0){
    var lowestScoredPlayer = playerRotation[0];

    //Loop through the playerRotation, addings songs from each player until they have more than the others
    while(keepSearching) {

      //Find the lowest scored player out of all the players
      for (var i=0; i<playerRotation.length; i++) {
        if(playerRotation[i].score < lowestScoredPlayer.score){
          lowestScoredPlayer = playerRotation[i];
        }
      }

      //Checks if the player can add any more songs, and adds one if possible
      if(lowestScoredPlayer.index < lowestScoredPlayer.playlist.length) {
        var thisSong = lowestScoredPlayer.playlist[lowestScoredPlayer.index];
        host.playlist.push(thisSong);
        lowestScoredPlayer.index++;

        //Increments scores for every player who has the song
        for (var i=0; i<playerRotation.length; i++) {
          if(playerRotation[i].lookup[thisSong] == 1){
            playerRotation[i].score++;
          }
        }
      }

      //Stops looping through the playlist if the current player cant add any more Music
      else{
        keepSearching=false;
      }
    }
  }
}

function createSharedPlaylist(host){
  host.playlist = [];
  var players = [];
  var fullplaylist = {};

  host.playerlist.forEach(function(player){
    player.personalPlaylist.forEach(function(song){
      if (fullplaylist[song] == undefined)
        fullplaylist[song] = 1;
      else
        fullplaylist[song]++;
    });
  });

  for (song in fullplaylist) {
    if (fullplaylist[song] > players.length*0.66)
      host.playlist.push(song);
  }
}
