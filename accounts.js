var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://admin:fr44reals@ds119161.mlab.com:19161/shamradio";
var md5 = require('md5');
var bcrypt = require('bcrypt');

var db;
var users;

MongoClient.connect(url, function(err, dbo) {
  db = dbo.db("shamradio");
  users = db.collection("Users");
});

module.exports = {
  checkUserSession: checkUserSession,
  register: register,
  login: login,
  logout: logout
};

function checkUserSession(thisUserSession) {
  return new Promise((resolve,reject)=>{
    users.findOne({userSession: thisUserSession}).then(function(colldata, err){
      if(err) reject(err);
      else resolve(colldata);
    });
  });
}

function register(thisUsername,thisPassword) {
    return new Promise((resolve,reject)=>{
    users.findOne({username: thisUsername}).then(function(colldata, err){
      if(err) reject(err);
      //If an account already exists
      else if (colldata!= null) resolve(null);
      //Create a new account
      else {
        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(thisPassword, salt, function(err, hash) {
              findNewUserSession().then(function(myUserSession){
                user={
                  username: thisUsername,
                  salt: salt,
                  password: hash,
                  userSession: myUserSession,
                  spotifyToken: undefined,
                  anilistAccount: undefined,
                  spotifyPlaylist: [],
                  anilistPlaylist: []
                }
                users.insert(user);
                resolve(user);
              });
            });
        });
      }
    });
  });
}

function login(thisUsername,thisPassword) {
  return new Promise((resolve,reject)=>{
    users.findOne({username: thisUsername}).then(function(colldata, err){
      if(err) reject(err);
      else{
        //If the account does not exist
        if(colldata==null) {
          resolve(null);
        }
        else {
          //Incorrect password
          bcrypt.compare(thisPassword, colldata.password, function(err, res) {
            if(colldata.password != md5(colldata.salt+thisPassword) && !res) resolve(null);
            else{
              resolve(colldata);
            }
          });
        }
      }
    });
  });
}

function findNewUserSession(){
  return new Promise((resolve,reject)=>{
    tryAgain();

    function tryAgain() {
      var thisUserSession=generateRandom(15);
      users.findOne({userSession: thisUserSession}).then(function(colldata, err){
        if(err) reject(err);
        else{
          //No session exists
          if(colldata==null) resolve(thisUserSession);
          else tryAgain();
        }
      });
    }
  });
}

function logout(thisUserSession){
  users.findOne({userSession: thisUserSession}).then(function(colldata, err){
    if(err) reject(err);
    else{
      //No session exists
      if(!colldata==null)
      {
        colldata.userSession=undefined;
        users.save(colldata);
      }
    }
  });
}

function generateRandom(length){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
