var fs = require('fs');

module.exports = {
    getMongoURL: getMongoURL
};

function getMongoURL() {
  try {
    return fs.readFileSync('mongoURL.txt', 'utf8');
  } catch (err){
    return process.env.mongoURL;
  }
}
