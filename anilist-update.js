var configs = require('./configs.js');
var url = configs.getMongoURL();
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
  animelist.aggregate([{$match: {songid: {$not: {$eq: 'dupe'}}, popularity: {$gte:90}}} ,{$sample: {size: 10}}]).toArray().then(function(doc){
    console.log(doc);
    doc.forEach(song => {
      anilist.updateShow(song);
    })

  });
});
