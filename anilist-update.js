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

  generateYearArray();

  //Generates a year array
  function generateYearArray() {
    yeararray = ['/60s/','/70s/','/80s/','/90s/'];
    for (var i=2000; i<=(new Date()).getFullYear(); i++) {
      ['Winter','Spring','Summer','Autumn'].forEach(season =>{
        yeararray.push('/'+i+'/'+season+'/');
      });
    }
  }

  //Fetches a single year
  function fetchYear(thisUrl){
    console.log('Fetching '+thisUrl);
    var options = {
        method: 'POST',
        headers: {
         'User-Agent': 'Mozilla/5.0',
         'Accept': '*/*',
         //'Content-Length': 58,
         'Content-Type': 'application/x-www-form-urlencoded',
       },
       body: JSON.stringify({
         "action":"get",
         "items":{
           "href":thisUrl,
           "what":1
         }
       })
     },
      url = "https://aninx.com"+thisUrl;

    fetch(url, options)
    .then(function(response){
      return (response.json());
    })
    .then(function(data){
      data.items.forEach(item => {
        var link = item.href;
        if(link.indexOf(thisUrl)>=0) {
          var name = decodeURIComponent(link);
          name = name.slice(thisUrl.length,-1);
          var namearray = [];
          namearray.push(name);
          animetest.find(
            {$or:[
              {series: name},
              {alternateNames: {$in: namearray } }
          ]}).toArray().then(function(songs){
            if(songs!=null) {
              if(songs.length>0) {
                songarray.push([link,songs]);
                console.log(link);
              } else{
              }
            }
          });
        }
      });
    });
  }

  //Fetches the songs that may be associated with a show
  function fetchSongs(url, songs){
    try{
      var options = {
          method: 'POST',
          headers: {
           'User-Agent': 'Mozilla/5.0',
           'Accept': '*/*',
           //'Content-Length': 58,
           'Content-Type': 'application/x-www-form-urlencoded',
         },
         body: JSON.stringify({
           "action":"get",
           "items":{
             "href":url,
             "what":1
           }
         })
       },
        url = "https://aninx.com"+url;

      fetch(url, options)
      .then(function(response){
        return (response.json());
      })
      .then(function(data){
        //console.log(data);
        songs.forEach(song => {
          var findMe = '%5B';
          if(song.ending) findMe = findMe + 'ED';
          else findMe = findMe + 'OP';
          while(song.opNumber.indexOf('0') == 0) {
            song.opNumber = song.opNumber.slice(1);
          }
          findMe = findMe+song.opNumber;
          var possibleEntry=undefined;

          //Find the smallest matching OP/ED;
          data.items.forEach(item =>{
            if (item.href.indexOf(findMe)>0){
              if(possibleEntry==undefined) {
                possibleEntry=item;
              }
              else {
                if(item.size < possibleEntry.size)
                  possibleEntry=item;
              }
            }
          });

          if(possibleEntry == undefined) {
            console.log('---'+song.series+" "+findMe+" not found.")
          }
          else {
            song.url = "https://aninx.com"+possibleEntry.href;
            song.type = 'video/webm'
            animelist.insert(song);
            animetest.remove({songid: song.songid});

            console.log(song.series, song.url);
          }
        });
      });
    } catch(err) {console.log(err);}
  }

  var songarray=[];


  setInterval(function(){
    if(songarray.length>0){
      var thisItem = songarray.pop();
      fetchSongs(thisItem[0],thisItem[1]);
    }

    else if (yeararray.length>0){
      fetchYear(yeararray.pop());
    }

  }, 8000);
});
