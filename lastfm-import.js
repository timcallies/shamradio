var apikey = "4ad5fb4ef2e8815c6ef22318fa445489";
var configs = require('./configs.js');
var sharedSecret = configs.getLastFMSecret();
var url = configs.getMongoURL();
var MongoClient = require('mongodb').MongoClient;
const LastFM = require('last-fm');
const lastfm = new LastFM(apikey);

var db;
var songCollection;
const genres = [
  "rock",
  "pop",
  'hip hop',
  'rap',
  "jazz",

  'Classical',
  "electronic",
  "alternative",
  "indie",
  "metal",
  "classic rock",
  "experimental",
  "folk",
  "punk",
  "instrumental",
  'death metal',
  'Soundtrack',
  'other',
  'blues',
  'country'
];

module.exports = {
  updateSong: updateSong,
  getTags: getTags
};


MongoClient.connect(url, function(err, dbo) {
  db = dbo.db("shamradio");
  songCollection = db.collection("Songlist");
});

function getTags(){
  return genres;
}

function updateSong(song){
  if(song==undefined) return;
  lastfm.trackTopTags({ name: song.name, artistName: song.artist }, (err, data) => {
    if (err) console.error(err)
    else {
      var tagarray=[];
      data.tag.forEach(function(thisTag){
        if(genres.indexOf(thisTag.name)>0)
        {
          tagarray.push(thisTag.name);
        }
      })
      if(tagarray.length==0) tagarray.push("other")
      song.tags=tagarray;
      songCollection.save(song);
    }
  })
}
