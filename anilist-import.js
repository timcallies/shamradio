var fetch = require('isomorphic-fetch');
var configs = require('./configs.js');
var url = configs.getMongoURL();
var db;
var animeTestCollection;
var animeCollection;
var mostPopular;
var MongoClient = require('mongodb').MongoClient;
getMostPopularAnime();

MongoClient.connect(url, function(err, dbo) {
  db = dbo.db("shamradio");
  animeTestCollection = db.collection("AnimeTest");
  animeCollection = db.collection("Animelist");
  users = db.collection("Users");

  animeTestCollection.find().forEach(function(data){
    opStack.push(data);
  });
});

module.exports = {
    addShow: addShow,
    getTopShows: getTopShows,
    getAnilist: getAnilist,
    updateShow: updateShow
};

function getMostPopularAnime() {
  var query = `
  {
    Page (perPage: 1){
      media(type: ANIME, sort: POPULARITY_DESC) {
        popularity
      }
    }
  }`;

  var url = 'https://graphql.anilist.co',
      options = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
          },
          body: JSON.stringify({
              query: query,
          })
      };
  // Make the HTTP Api request
  return fetch(url, options).then(handleResponse)
                     .then(handleData)
                     .catch(handleError);

  function handleResponse(response) {
      return response.json().then(function (json) {
        return response.ok ? json : Promise.reject(json);
      });
  }

  function handleData(data) {
    mostPopular=(data.data.Page.media[0].popularity);
  }

  function handleError(error) {
      console.error(error);
  }
}

function getAnilist(anilistName, thisUsername) {
  return new Promise((resolve,reject)=>{
    var query = `
    query ($id: String) {
      User (name: $id) {
        name
      }
    }`;

    var variables = {
      id: anilistName
    };

    var url = 'https://graphql.anilist.co',
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };


    // Make the HTTP Api request
    fetch(url, options).then(handleResponse)
                       .then(handleData)
                       .catch(handleError);

    function handleResponse(response) {
        return response.json().then(function (json) {
          return response.ok ? json : reject(json);
        });
    }

    function handleData(data) {
      if(data==undefined) {
        resolve(undefined);
      }
      else{
        users.findOne({username: thisUsername}).then(function(user, err){
          user.anilistAccount=data.data.User.name;
          user.anilistPlaylist=[];
          users.save(user);
        });
        resolve(data.data.User.name);
        importStack.push([thisUsername,0]);
      }

    }

    function handleError(error) {
        console.error(error);
    }
  });

}

//Adds a single page of a user's list to the stack.
function getMoreEntries(thisUsername, offset) {
  users.findOne({username: thisUsername}).then(function(user, err){
    if(err) Promise.reject(err);
    else{
      var query = `
      query($username: String, $page: Int) {
        Page(page:$page, perPage: 25) {
          mediaList(userName: $username, status: COMPLETED, type: ANIME, sort: SCORE_DESC) {
            media {
              idMal
            }
            score(format: POINT_100)
          }
        }
      }`;

      var variables = {
        username: user.anilistAccount,
        page: offset
      };

      var url = 'https://graphql.anilist.co',
          options = {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
              },
              body: JSON.stringify({
                  query: query,
                  variables: variables
              })
          };


      // Make the HTTP Api request
      fetch(url, options).then(handleResponse)
                         .then(handleData)
                         .catch(handleError);

      function handleResponse(response) {
          return response.json().then(function (json) {
            return response.ok ? json : Promise.reject(json);
          });
      }

      function handleData(data) {
        if(!(data==undefined)) {
          //Gets the users list
          data.data.Page.mediaList.forEach(function(thisItem){
            user.anilistPlaylist.push(["mal#"+thisItem.media.idMal,thisItem.score]);
            users.save(user);
            //Adds the next batch to the queue
          });
          if(data.data.Page.mediaList.length==25)
          {
            importStack.push([thisUsername,offset+1]);
          }
        }
      }
      function handleError(error) {
          console.error(error);
      }
    }
  });
}

// Define the config we'll need for our Api request
function getTopShows(page_count, per_page) {
  var query = `
  query ($perPage: Int, $page: Int) {
    Page (page: $page, perPage: $perPage) {
      media (sort: POPULARITY_DESC, type: ANIME) {
        id
        idMal
        averageScore
        popularity
        title {
          romaji
          english
        }
        synonyms
        startDate{
          year
        }
        genres
        coverImage {
          large
        }
        studios(isMain: true) {
          edges {
            node {
              name
            }
          }
        }
      }
    }
  }`;

  var variables = {
    page: page_count,
    perPage: per_page
  }

  var url = 'https://graphql.anilist.co',
      options = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
          },
          body: JSON.stringify({
              query: query,
              variables: variables
          })
      };

  // Make the HTTP Api request
  fetch(url, options).then(handleResponse)
                     .then(handleData)
                     .catch(handleError);

  function handleResponse(response) {
      return response.json().then(function (json) {
        return response.ok ? json : Promise.reject(json);
      });
  }

  function handleData(data) {
    data.data.Page.media.forEach(function(media){
      addShow(media);
    });
  }

  function handleError(error) {
      console.error(error);
  }
}

function updateShow(show) {
  var query = `
  query ($id: Int) {
    Media (id: $id, type: ANIME) {
      id
      popularity
      averageScore
      genres
      coverImage {
        large
      }
      studios(isMain: true) {
        edges {
          node {
            name
          }
        }
      }
    }
  }`;

  var variables = {
    id: parseInt(show.idAlist.split("#")[1])
  }

  var url = 'https://graphql.anilist.co',
      options = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
          },
          body: JSON.stringify({
              query: query,
              variables: variables
          })
      };

  // Make the HTTP Api request
  fetch(url, options).then(handleResponse)
                     .then(handleData)
                     .catch(handleError);

  function handleResponse(response) {
      return response.json().then(function (json) {
        return response.ok ? json : Promise.reject(json);
      });
  }

  function handleData(data) {
    show.popularity = (1-(1-(data.data.Media.popularity*1.0)/mostPopular)**5)*100;
    show.averageScore = data.data.Media.averageScore;
    show.tags = data.data.Media.genres;
    show.studio = data.data.Media.studios.edges[0].node.name;
    show.coverart = data.data.Media.coverImage.large;
    console.log(show);
    animeCollection.save(show);
  }

  function handleError(error) {
      console.error(error);
  }
}

function addShow(data) {
  try {
    var song = undefined;
      fetch('https://myanimelist.net/anime/'+data.idMal)

        .then(function(response) {
          if (response.status >= 400) {
              throw new Error("Bad response from server");
          }
          return response.text();
        })
        .then(function (body) {
          try {
            var openingSongs = [];
            //Find all the titles of the series
            var alltitles = [];
            alltitles.push(data.title.english);
            data.synonyms.forEach(function(name) {
              alltitles.push(name)
            });
            if (alltitles.indexOf(null)==0){
              alltitles.shift();
            }

            getOped('op',0);
            getOped('ed',1);

            function getOped(oped,num) {
              var openings=body.split('<div class="theme-songs js-theme-songs ending">')[num].split('<span class="theme-song">');
              var tags = data.genres;
              tags.push('Other');

              for (var i=1; i< openings.length; i++) {
                op = openings[i].split("</span>")[0];
                var number = op.split("&quot;")[0].split("#").join('').split(":").join('').trim();
                var name = op.split("&quot;")[1].trim();
                var artist = op.split("&quot;")[2].split(" by ")[1].split(" (ep")[0].trim();
                var studio = undefined;
                try {
                  studio = data.studios.edges[0].node.name;
                } catch(err) {}


                //Create the song object
                song = {
                  songid: (oped+"#"+data.id+"#"+number),
                  idMal: ("mal#"+data.idMal),
                  idAlist: ("alist#"+data.id),
                  name: name,
                  series: data.title.romaji,
                  artist: artist,
                  opNumber: number,
                  coverart: data.coverImage.large,
                  url: "Unknown",
                  popularity: (1-(1-(data.popularity*1.0)/mostPopular)**5)*100,
                  year: parseInt(data.startDate.year),
                  type: "Unknown",
                  alternateNames: alltitles,
                  averageScore: data.averageScore,
                  ending:(oped=='ed'),
                  tags: tags,
                  studio: studio,
                  wins: 1.0,
                  losses: 1.0,
                  ratio: 1.0,
                };
                openingSongs.push(song);
              }

            }

            alltitles.push(data.title.romaji);

            //Adds the song
            openingSongs.forEach(function(song){
              animeTestCollection.findOne({songid: song.songid}).then(function(colldata, err){
                if (err) console.log(err);
                if(colldata==null) {
                  //console.log(song);
                  animeCollection.findOne({songid: song.songid}).then(function(colldata, err){
                    if (err) console.log(err);
                    if(colldata==null) {
                      animeTestCollection.insert(song);
                    }
                    else {
                      animeCollection.updateMany(
                        {idAlist: song.idAlist},
                        {$set: {
                          averageScore: song.averageScore,
                          studio: song.studio,
                          tags: song.tags
                        }
                      });
                    }
                  });
                }
              });
            });

            //Adds the dupes
            alltitles.forEach(function(thisTitle){
              animeCollection.findOne({series: thisTitle}).then(function(colldata, err){
                if (err) console.log(err);
                if(colldata==null) {
                  animeCollection.insert({songid: "dupe", series: thisTitle});
                }
              });
            });
          } catch (err) {}
        });
  }
  catch(err) {}
  //console.log(data);

}
// Define our query variables and values that will be used in the query request


var opStack = [];
var anilisti = 0;
var importStack = [];

setInterval(function(){
  if(importStack.length>0){
    var thisPerson = importStack.pop();
    getMoreEntries(thisPerson[0],thisPerson[1]);
  }
},1000);

setInterval(function(){
  if(anilisti<3000)
  {
    getTopShows(anilisti,10)
    anilisti++;
  }
  else {
    anilisti=0;
  }
},40000);
