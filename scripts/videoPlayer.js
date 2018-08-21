var currentType = undefined;
var element = undefined;
var audio = undefined;
var ytVid = undefined;
var container;

function videoPlayer(thisContainer) {
  container=thisContainer;
  document.getElementById(thisContainer).innerHTML=
  '<div id = "youtubeWindow" class = "contentPlayer"></div>'+
  '<image id = "musicWindow" class = "contentPlayer"></image>'+
  '<div id = "videoinfo">Lorem Ipsum Dolor Set ~ The Musical</div>';
}

videoPlayer.prototype.play = function(name, album, artist, coverArt, url, type) {
  try {
    currentType=type;
    document.getElementById('videoinfo').innerHTML="<h3>"+name[0]+"</h3><h4>"+album+"</h4><h4>"+artist+"</h4>";
    document.getElementById('cover').setAttribute("style", "display: block; opacity: 1.0;");
    status = "playing";
    if(type=='video/webm'){

      $('#'+container).prepend('<video id ="videoWindow" class = "contentPlayer"></video>');
      element = document.getElementById("videoWindow");
      playvideo(url, type);
    }

    if (type=='youtube'){
      element = document.getElementById("youtubeWindow");

      playYoutube(url);
    }

    if (type=='audio'){
      element = document.getElementById("musicWindow");
      playMusic(url,coverArt);
    }

    function playvideo(src, type) {
      document.cookie = "lastPlayed=anime";
      element.setAttribute("style", "display: block;");
      element.type = type;
      element.src=src;
      element.autoplay = true;
      element.load();
    }

    //When a youtube video is played
    function playYoutube(src) {
      element.setAttribute("style", "display: block;");
      var srcUrl;
      var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      var match = src.match(regExp);
      if (match && match[2].length == 11) {
        srcUrl = match[2];
      }
      ytPlayer = new YT.Player('youtubeWindow', {
          videoId: srcUrl,
          events: {
            'onReady': onPlayerReady,
          }
      });
      function onPlayerReady(event) {
        event.target.playVideo();
        ytVid=event.target;
      }
    }

    //When a music file is played
    function playMusic(url,coverArt){
      document.cookie = "lastPlayed=music";
      element.setAttribute("src", coverArt);
      element.setAttribute("style", "display: block;");
      audio = new Audio(url);
      audio.play();
      setTimeout(function(){

        //continuePlaying();
      }, (gameTime*1000+10000));
    }
  } catch(err) {errorMessage(err);}
}

videoPlayer.prototype.stop = function(){
  try {
    if (currentType==undefined || element==undefined) return;
    if (currentType=='audio') {
      audio.pause();
      element.setAttribute("style", "display: none;");
    }
    if (currentType=='youtube') {
      ytVid.stopVideo();
      ytVid.destroy();
      element.setAttribute("style", "display: none;");
    }
    if (currentType=='video/webm') {
      element.pause();
      $('#videoWindow').remove();
    }
  } catch(err) {console.log(err);}
}
