var url = "mongodb://admin:fr44reals@ds119161.mlab.com:19161/shamradio";
var MongoClient = require('mongodb').MongoClient;
var songlist;

MongoClient.connect(url, function(err, dbo) {
  db = dbo.db("shamradio");
  songlist = db.collection("Songlist");
});

setTimeout(function(){
  songlist.find().forEach(function(song){
    //console.log(song.name);
    var originalName = undefined;
    if (song.name.indexOf('Remaster')>0) {
      originalName = (removeFromTitle(song.name, 'Remaster'));
    }
    else if (song.name.indexOf('Remix')>0) {
      originalName = (removeFromTitle(song.name, 'Remix'));
    }
    else if (song.name.indexOf('Live')>0) {
      originalName = (removeFromTitle(song.name, 'Live'));
    }

    if(originalName!=undefined) {
      console.log(originalName);
      song.alternateTitles.push(originalName);
      songlist.save(song);
      var query = {
        name: {$regex: originalName, $options: 'i' },
        artist: song.artist
      };
      songlist.findOne({name: originalName}).then(function(colldata) {
        if (colldata==null) {
          songlist.insert({songid: "dupe", name: originalName});
        }

        songlist.find(query).toArray(function(dupedata){
          if(dupedata==undefined) return;
          if(dupedata.length==1) return;
          console.log(song.name,dupedata);
          dupedata.forEach(function(thisSong){
            thisSong.alternateTitles.push(song.name);
            thisSong.alternateAlbums.push(song.album);
            thisSong.alternateIds.push(song.songid);
            songlist.save(thisSong);
          });
        });
      });
    }


    //songlist.save(song);
  });
},5000);

setTimeout(function(){
  songlist.find().forEach(function(song){
    song.alternateTitles=[];
    song.alternateAlbums=[];
    song.alternateIds=[];
    songlist.save(song);
  });
},1000);

function removeFromTitle(songname, toRemove) {
  if (songname.lastIndexOf('-') < songname.indexOf(toRemove) && songname.indexOf('-')>0 ) {
    return (songname.split('-')[0]).trim();
  }
  else if (songname.lastIndexOf('(') < songname.indexOf(toRemove) && songname.indexOf('(')>0) {
    return (songname.split('(')[0]).trim();
  }
}
