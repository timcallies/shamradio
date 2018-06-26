var url = "mongodb://localhost:27017/";
var url2 = "mongodb://admin:fr44reals@ds119161.mlab.com:19161/shamradio";
var MongoClient = require('mongodb').MongoClient;
var localAnimelist;
var publicAnimelist;

MongoClient.connect(url, function(err, dbo) {
  db = dbo.db("NodeMusicQuiz");
  localAnimelist = db.collection("Animelist");
});

MongoClient.connect(url2, function(err, dbo) {
  db = dbo.db("shamradio");
  publicAnimelist = db.collection("Animelist");
});

setTimeout(function(){
  localAnimelist.find().forEach(function(data){
    publicAnimelist.save(data);
  });
},2000);
