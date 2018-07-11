var fs = require('fs');

module.exports = {
    getMongoURL: getMongoURL,
    getSpotifySecret: getSpotifySecret,
    getLastFMSecret: getLastFMSecret
};

function getMongoURL() {
  try {
    return fs.readFileSync('mongoURL.txt', 'utf8');
  } catch (err){
    return process.env.mongoURL;
  }
}

function getSpotifySecret() {
  try {
    return fs.readFileSync('spotifySecret.txt', 'utf8');
  } catch (err){
    return process.env.spotifySecret;
  }
}

function getLastFMSecret() {
  try {
    return fs.readFileSync('lastFMsecret.txt', 'utf8');
  } catch (err){
    return process.env.lastFMSecret;
  }
}
