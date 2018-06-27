var hovering;
var chatDisplayCounter = 0;

function chatContainer(container,socket,hostsocket) {
  document.getElementById(container).innerHTML=
  '<ul id="chat-messages"></ul>'+
  '<form id="chat-form" action="">'+
    '<input id="chat-input" autocomplete="off" placeholder="Chat"/><button id="chat-button">Send</button>'+
  '</form>';


  setInterval(function(){
    if(!hovering)
    {
      if(chatDisplayCounter<=0){
        $('#chat-messages').css("height", "0px");
      }
      else{
        chatDisplayCounter -= 100;
      }
    }
  },100);

  $(("#chat-container")).hover(function(){
    hovering = true;
    $('#chat-messages').css("height", "400px");
  }, function(){
    hovering = false;
    chatDisplayCounter=2000;
  });

  $('#chat-form').submit(function(){
    socket.emit('chat message', getCookie('sessionId'), hostid, $('#chat-input').val());
    $('#chat-input').val('');
    return false;
  });

  $('#chat-button').click(function() {
    $('#chat-messages').css("height", "0px");
  });

  $('#chat-input').click(function() {
    $('#chat-messages').css("height", "400px");
  });


  hostsocket.on('chat message', function(name,msg){
    var thisText = $('<li>').text(name+": "+msg);
    $('#chat-messages').append(thisText);
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
    $('#chat-messages').css("height", thisText.outerHeight());
    chatDisplayCounter=2000;
  }
  var element = document.getElementById("chat-messages");
  element.scrollTop = element.scrollHeight;
}
