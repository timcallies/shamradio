


var selectedPresetId = '1';

function openSelectScreen() {
  $('.select-black-cover').fadeIn(200);
  $('.select-playlist-window').fadeIn(200);
  $('.playlist-option-selected').removeClass('playlist-option-selected');
  if($('#playlist-id-'+selectedPresetId).length != 0) {
    $('#playlist-id-'+selectedPresetId).addClass('playlist-option-selected');
  }
  else if($('#playlist-my-'+selectedPresetId).length != 0) {
    $('#playlist-my-'+selectedPresetId).addClass('playlist-option-selected');
  }
  else {$('#playlist-id-1').addClass('playlist-option-selected');}
}

function findNameById(id){
  if($('#playlist-id-'+id).length != 0) {
    return $('#playlist-id-'+id).find('.playlist-name').text();
  }
  if($('#playlist-my-'+id).length != 0) {
    return $('#playlist-my-'+id).find('.playlist-name').text();
  }
}

function refreshPresets(presets) {
  $('.playlist').empty()

  presets[0].forEach(function(preset) {
    if(preset.description==null){
      preset.description='(No description)';
    }
    addPreset('#default-playlists',preset.id, preset.name, preset.description, 'Shamradio');
  });

  presets[1].forEach(function(preset) {
    if(preset.description==null){
      preset.description='(No description)';
    }
    addPreset('#your-playlists',preset.id, preset.name, preset.description, preset.owner);
  });
}

socket.on('presetsavedresponse',function(presets,id) {
  refreshPresets(presets);
  selectedPresetId = id;
  $('.select-playlist').text(findNameById(id));
});

function closeSelectScreen() {
  var element = $('.playlist-option-selected');
  selectedPresetId = element.attr('id').split('-')[2];
  $('.select-playlist').text(element.find('.playlist-name').text());
  updatePlaylistChoice(selectedPresetId);

  $('.select-black-cover').fadeOut(200);
  $('.select-playlist-window').fadeOut(200);
}

socket.emit('presetrequest', getCookie('userSession'));
socket.on('presetresponse',function(presets) {
  updatePresets(presets);
});

function addPreset(div,id,name,description,owner){
  var prefix='id';
  if(div == '#your-playlists') {
    prefix = 'my';
  }
  $(div).append($('<li class = "playlist-option" id="playlist-'+prefix+'-'+id+'">'));
  $('#playlist-'+prefix+'-'+id).append($('<div class="playlist-name">').text(name).click(function() {
    $('.playlist-option-selected').removeClass('playlist-option-selected');
    $(this).parent().addClass('playlist-option-selected');
  }));
  $('#playlist-'+prefix+'-'+id).append($('<div class = "playlist-arrow">More info...</div>').click(function(){
    var group = $(this).parent().find('.playlist-group');
    var idealHeight = 0

    if(group.css('height') == '0px' || group.css('height') == 'auto') {
      group.children().each(function() {
        idealHeight += parseInt($(this).outerHeight());
      });
      group.css('height',(idealHeight+'px'));
    }

    group.css('height',(idealHeight+'px'));
  }));
  $('#playlist-'+prefix+'-'+id).append($('<div class = "playlist-group" id="playlist-group-'+prefix+'-'+id+'">'));
  $('#playlist-group-'+prefix+'-'+id).append($('<div class = "playlist-owner" id="creator-'+prefix+'-'+id+'">').text('Created by '+owner));
  $('#playlist-group-'+prefix+'-'+id).append($('<div class = "playlist-description" id="description-'+prefix+'-'+id+'">').text(description));

  if(prefix=='my'){
    $('#description-my-'+id).append('<img src="/img/pencil.png"/>');
    $('#playlist-group-'+prefix+'-'+id).append('<span class="buttons-save-delete">');
    $('#playlist-group-'+prefix+'-'+id).find('.buttons-save-delete').append($('<button id="deletepreset">').text('Delete').click(function(){
      socket.emit('deletepreset',getCookie("userSession"),id);
      $(this).parent().parent().parent().remove();
    }));
    $('#description-my-'+id).click(function() {
      var thisDescription = $(this);
      var group = $(this).parent();
      var text = $(this).text();
      $(this).empty();
      $(this).parent().find('.buttons-save-delete').before($('<textarea rows="4" class="description">').val(text));
      $(this).parent().find('.buttons-save-delete').append($('<button id="savepreset">').text('Save').click(function(){
        thisDescription.text(group.find('textarea').val()).append('<img src="/img/pencil.png"/>');;
        socket.emit('savepresetdescription',getCookie('userSession'), id, group.find('textarea').val());

        group.find('textarea').remove();
        group.find('button#savepreset').remove();
        var idealHeight = 0;
        group.children().each(function() {
          idealHeight += parseInt($(this).outerHeight());
        });
        group.css('height',(idealHeight+'px'));
      }));

      var idealHeight = 0;
      group.children().each(function() {
        idealHeight += parseInt($(this).outerHeight());
      });
      group.css('height',(idealHeight+'px'));
    });
  }
}
