var accounts = require('./accounts.js');

module.exports = {
    importSpotifyPlaylists: importSpotifyPlaylists,
    importAnilistPlaylists: importAnilistPlaylists,
    createFullPlaylist: createFullPlaylist,
    createBalancedPlaylist: createBalancedPlaylist,
    createSharedPlaylist: createSharedPlaylist,
    importSpotifyPlaylist: importSpotifyPlaylist,
    importAnilistPlaylist: importAnilistPlaylist
};

function importSpotifyPlaylists(host){
  host.playerlist.forEach(function(player){
    player.personalPlaylist=[];
    accounts.checkUserSession(player.userSession).then(function(account){
      if (account!=null){
        if (account.spotifyAccount!=undefined){
          account.spotifyPlaylist.forEach(function(song) {
            player.personalPlaylist.push(song);
          });
        }
      }
    })
  });
}

function importSpotifyPlaylist(player){
  player.personalPlaylist=[];
  accounts.checkUserSession(player.userSession).then(function(account){
    if (account!=null){
      if (account.spotifyAccount!=undefined){
        account.spotifyPlaylist.forEach(function(song) {
          player.personalPlaylist.push(song);
        });
      }
    }
  })
}

function importAnilistPlaylist(player,host){
  player.personalPlaylist=[];
  accounts.checkUserSession(player.userSession).then(function(account){
    if (account!=null){
      if (account.anilistAccount!=undefined){
        account.anilistPlaylist.forEach(function(song) {
          //console.log(song);
          if(song[1]>=host.options.scoreMin && song[1] <= host.options.scoreMax) {
            console.log(song);
            player.personalPlaylist.push(song[0]);
          }
        });
      }
    }
  })
}

function importAnilistPlaylists(host){
  host.playerlist.forEach(function(player){
    player.personalPlaylist=[];
    accounts.checkUserSession(player.userSession).then(function(account){
      if (account!=null){
        if (account.anilistAccount!=undefined){
          account.anilistPlaylist.forEach(function(song) {
            //console.log(song);
            if(song[1]>=host.options.scoreMin && song[1] <= host.options.scoreMax) {
              console.log(song);
              player.personalPlaylist.push(song[0]);
            }
          });
        }
      }
    })
    console.log(host.playerlist);
  });
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

  //Reduces the playlist to only players who have playlists
  host.playerlist.forEach(function(player){
    if (player.length>0) {
      players.push(player);
    }
  });

  //If there are playlists to sort through, finds only elements that appear in all playlists
  if (players.length>0) {
    players[0].forEach(function(song){
      var addSong = true;
      var i=1;

      //Looks through every playlist and only adds the song if it appears in them all
      while(i<players.length && addSong) {
        if(players[i].indexOf(song)==0) {
          addSong=false;
        }
        i++;
      }
      if(addSong){
        host.playlist.push(song);
      }
    });
  }
}
