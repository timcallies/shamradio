function inputScreen() {
  document.getElementById("input-screen-container").innerHTML=
  '<div id="guessfield" class="guess-bg">'+
    '<form id="guessform" action="" style = "display:inline-flex;">'+
      '<input id="guess-textbox" class="guess-input" autocomplete="off"/>'+
      '<button class="guess-button">Send</button>'+
    '</form>'+
    '<ul id="possiblechoices" class= "guess-list"></ul>'+
  '</div>';

}

function inputScreenReverse() {
  document.getElementById("input-screen-container").innerHTML=
  '<div id="guessfield" class="guess-bg">'+
    '<ul id="possiblechoices" class= "guess-list"></ul>'+
    '<form id="guessform" action="" style = "display:inline-flex;">'+
      '<input id="guess-textbox" class="guess-input" autocomplete="off" placeholder="Guess"/>'+
      '<button class="guess-button">Send</button>'+
    '</form>'+
  '</div>';
}

var inputActive=0;

$(function () {
  $( "#guess-textbox" ).keydown(function() {
    socket.emit('checktext',hostid,$('#guess-textbox').val());
  });

});

$(function () {
  $('#guessform').submit(function(){
    submitGuess($('#guess-textbox').val());
    return false;
  });
});




function updateGuessChoices(tags) {
  var listElement = document.getElementById('possiblechoices');
  $("#possiblechoices").empty();
  for(var i=0; i<tags.length; i++) {
    $('#possiblechoices').append($('<li class="choice" onclick="submitGuess(\''+tags[i].replace("'","\\'")+'\')">').text(tags[i]));
  }
}

function hideInputScreen()
{
  inputActive=0;
  document.getElementById("guessfield").setAttribute("style", "display: none;");
}

function showInputScreen()
{
  inputActive=1;
  document.getElementById("guessfield").setAttribute("style", "display: block;");
}

function resetGuessChoices()
{
  $("#possiblechoices").empty();
  document.getElementById('guess-textbox').value='';
}
