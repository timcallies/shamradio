var configs = require('./configs.js');
var url = configs.getMongoURL();
var MongoClient = require('mongodb').MongoClient;


MongoClient.connect(url, function(err, dbo) {
  db = dbo.db("shamradio");
  animelist = db.collection("Animelist");
  animetest = db.collection("AnimeTest");

  var genreArray = [];

  animelist.find().toArray().then(animeArray => {
    animeArray.forEach(anime => {
      if(anime.tags!=undefined) {
        anime.tags.forEach(tag => {
          if(genreArray.indexOf(tag)<0) {
            genreArray.push(tag);
            console.log(tag);
          }
        });
      }
    });
    console.log(genreArray)
  });

})
