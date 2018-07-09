var url = "mongodb://admin:fr44reals@ds119161.mlab.com:19161/shamradio";
var MongoClient = require('mongodb').MongoClient;
var anilist = require('./anilist-import.js');
var songlist;
var fetch = require('isomorphic-fetch');
var songarray = [];
var animetest;
var animelist;
var yeararray=[];

MongoClient.connect(url, function(err, dbo) {
  db = dbo.db("shamradio");
  animelist = db.collection("Animelist");
  animetest = db.collection("AnimeTest");
  animelist.find({tags: null}).toArray().then(function(array){
    array.forEach(song => {
      song.tags = ['Other'];
      animelist.save(song);
    });
  });






});
