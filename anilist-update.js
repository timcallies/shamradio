var url = "mongodb://admin:fr44reals@ds119161.mlab.com:19161/shamradio";
var MongoClient = require('mongodb').MongoClient;
var anilist = require('./anilist-import.js');
var songlist;
var songarray = [];

MongoClient.connect(url, function(err, dbo) {
  db = dbo.db("shamradio");
  animelist = db.collection("Animelist");
  animetest = db.collection("AnimeTest");

  //animelist.find({songid: {$not: {$eq: "dupe"}}, averageScore: {$not: {$gte: 0}}}).forEach(function(song) {
  //  songarray.push(song);
  //});
  animetest.find({popularity: {$gte: 50}}).toArray().then(function(data) {
    data.forEach(function(song){
      songarray.push(song);
    });
  });
});


setInterval(function(){
  if(songarray.length>0) {
    anilist.findOpFromAninx(songarray.pop());
  }
},2000);
