var hovering = false;
var chatDisplayCounter = 0;
var chatheight = 0;



function chatContainer(container,socket,hostsocket) {
  document.getElementById(container).innerHTML=
  '<ul id="chat-messages"></ul>'+
  '<form id="chat-form" action="">'+
    '<input id="chat-input" autocomplete="off" placeholder="Chat"/><button id="chat-button">Send</button>'+

  '</form>'+
  '<div id="exit-chat" class="exit-chat">';
  rescalePage();


  setInterval(function(){
    if(!hovering)
    {
      if(chatDisplayCounter<=0){
        $('#chat-messages').css("height", "0px");
        $('#exit-chat').fadeOut(500);
      }
      else{
        chatDisplayCounter -= 100;
      }
    }
  },100);

  $(("#chat-form")).hover(function(){
    hovering = true;
    $('#chat-messages').css("display","flex");
    $('#chat-messages').css("height", "400px");
    $('#exit-chat').fadeIn(500);
  }, function(){
    hovering = false;
    chatDisplayCounter=2000;
  });

  $('#chat-form').submit(function(){
    socket.emit('chat message', getCookie('sessionId'), hostid, $('#chat-input').val());
    $('#chat-input').val('');
    return false;
  });

  $('#exit-chat').click(function() {
    $('#chat-messages').css("height", "0px");
    $('#exit-chat').fadeOut(500);
  });

  $('#chat-form').hover(function() {
    $('#chat-messages').css("height", "400px");
    $('#exit-chat').fadeIn(500);
  });


  hostsocket.on('chat message', function(name,msg){
    var thisText = $('<li>').text(name+": "+msg);
    $('#chat-messages').append(thisText);
    $('#chat-messages').css("display","flex");
    if(!hovering) {
      $('#chat-messages').css("height", thisText.outerHeight());
      chatDisplayCounter=2000;
    }
    var element = document.getElementById("chat-messages");
    element.scrollTop = element.scrollHeight;
  });
}

function consoleMessage(msg){
  var thisText = $('<li>').text(msg);
  $('#chat-messages').append(thisText);
  if(!hovering) {
    $('#chat-messages').css("display","flex");
    $('#chat-messages').css("height", thisText.outerHeight());
    chatDisplayCounter=2000;
  }

  var element = document.getElementById("chat-messages");
  element.scrollTop = element.scrollHeight;
}

function errorMessage(msg){
  var thisText = $('<li class="error-messages">').text(msg);
  $('#chat-messages').append(thisText);
  if(!hovering) {
    $('#chat-messages').css("display","flex");
    $('#chat-messages').css("height", thisText.outerHeight());
    chatDisplayCounter=2000;
  }

  var element = document.getElementById("chat-messages");
  element.scrollTop = element.scrollHeight;
}
