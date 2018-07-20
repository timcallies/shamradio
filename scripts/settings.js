const genres = [
  "rock",
  "pop",
  'hip hop',
  'rap',
  "jazz",

  'Classical',
  "electronic",
  "alternative",
  "indie",
  "metal",
  "classic rock",
  "experimental",
  "folk",
  "punk",
  "instrumental",
  'death metal',
  'Soundtrack',
  'other',
  'blues',
  'country'
];

const genresAnime = [
  'Action',
  'Adventure',
  'Comedy',
  'Ecchi',
  'Drama',
  'Sci-Fi',
  'Mecha',
  'Thriller',
  'Fantasy',
  'Mystery',
  'Romance',
  'Psychological',
  'Supernatural',
  'Mahou Shoujo',
  'Slice of Life',
  'Sports',
  'Music',
  'Horror',
  'Other'
];
var canImport = false;

var filterGroup;
var filterElement;
var filterPlus;
var filterButton;

function settingsContainer(container) {
  $.get("/scripts/settings.html", function(data){
    $.get("/scripts/playlistSelect.html", function(data){
      document.getElementById('playlist-select-container').innerHTML=data;
      presetsLoaded();
    });
    document.getElementById(container).innerHTML=data;

    genres.forEach(function(genre){
      var tagName=genre.replace(/ /g,"_");
      $('#settings-select-tags').append($("<label id='settings-tag-"+tagName+"' class='checkboxcontainer'>").text(genre.toProperCase()));

      $('#settings-tag-'+tagName).append('<input value="'+genre+'" type="checkbox" checked="checked" class="tags-checkbox">');
      $('#settings-tag-'+tagName).append('<span class="checkboxmark"></span>');
    });

    genresAnime.forEach(function(genre){
      var tagName=genre.replace(/ /g,"_");
      $('#settings-select-tags-anime').append($("<label id='settings-tag-anime-"+tagName+"' class='checkboxcontainer'>").text(genre.toProperCase()));

      $('#settings-tag-anime-'+tagName).append('<input value="'+genre+'" type="checkbox" checked="checked" class="tags-anime-checkbox">');
      $('#settings-tag-anime-'+tagName).append('<span class="checkboxmark"></span>');
    });

    $("#music-mode").click(function() {
      $(".music-settings").css("display","block");
      $(".anime-settings").css("display","none");
      updateImport();
    });


    $(".option-tab").append($("<div class='expand'>").text('^'));
    $(".option-tab").click(function() {
      var x = document.getElementById($(this).attr('id')+'-group');
      if (x.style.display == "block") {
        $(this).find('.expand').css('transform','scaleY(-.7) scaleX(2)');
        x.style.display = "none";
      } else {
        $(this).find('.expand').css('transform','scaleY(.7) scaleX(2)');
        x.style.display = "block";
      }
    });

    filterElement = $('.filter').clone();
    filterPlus = $('.filter-add-box').clone();
    filterGroup = $('.filter-group').detach();
    filterButton = $('.rule-button').clone();
    refreshButtons();

    $("#anime-mode").click(function() {
      $(".music-settings").css("display","none");
      $(".anime-settings").css("display","block");
      updateImport();
    });

    $("#settings-import-anilist").click(function() {
      updateImport();
    });

    $("#settings-import-spotify").click(function() {
      updateImport();
    });

    function updateImport() {
      if (( (($('input[name=radio]:checked').val() == 'anime-mode')) &&
            ($('input[id=settings-import-anilist]').attr('checked'))) ||
          ( (($('input[name=radio]:checked').val() == 'music-mode')) &&
            ($('input[id=settings-import-spotify]').attr('checked')))) {

        canImport = true;
        $("#import-mode").css("display","inline-block");
      }

      else {
        $("#import-mode").css("display","none");
      }
    }


  $( function() {
    $( "#songs-range" ).slider({
      range: 'min',
      min: 1,
      max: 50,
      value: 10,

      slide: function( event, ui ) {
        $( "#songs-text" ).val((ui.value));
      }
    });
    $( "#songs-text" ).val(($( "#songs-range" ).slider( "value")));
  } );

  $( function() {
    $( "#length-range" ).slider({
      range: 'min',
      min: 5,
      max: 30,
      value: 20,

      slide: function( event, ui ) {
        $( "#length-text" ).val((ui.value));
      }
    });
    $( "#length-text" ).val(($( "#length-range" ).slider( "value")));
  } );

  $( function() {
    $( "#difficulty-range" ).slider({
      range: true,
      min: 0,
      max: 100,
      values: [ 0, 100],

      slide: function( event, ui ) {
        $( "#difficulty-text" ).val((ui.values[ 0 ] + " - " + ui.values[ 1 ] ));
      }
    });
    $( "#difficulty-text" ).val(($( "#difficulty-range" ).slider( "values", 0 ) +
      " - " + $( "#difficulty-range" ).slider( "values", 1 ) ));
  } );

  $( function() {
    $( "#difficulty-range" ).slider({
      range: true,
      min: 0,
      max: 100,
      values: [ 50, 100],

      slide: function( event, ui ) {
        $( "#difficulty-text" ).val((ui.values[ 0 ] + " - " + ui.values[ 1 ] ));
      }
    });
    $( "#difficulty-text" ).val(($( "#difficulty-range" ).slider( "values", 0 ) +
      " - " + $( "#difficulty-range" ).slider( "values", 1 ) ));
  } );

  $( function() {
    $( "#age-range" ).slider({
      range: true,
      min: 1900,
      max: (new Date()).getFullYear(),
      values: [ 1900, (new Date()).getFullYear()],

      slide: function( event, ui ) {
        $( "#age-text" ).val((ui.values[ 0 ] + " - " + ui.values[ 1 ] ));
      }
    });
    $( "#age-text" ).val(($( "#age-range" ).slider( "values", 0 ) +
      " - " + $( "#age-range" ).slider( "values", 1 ) ));
  } );

  $( function() {
    $( "#score-range" ).slider({
      range: true,
      min: 1,
      max: 100,
      values: [ 50, 100 ],

      slide: function( event, ui ) {
        $( "#score-text" ).val((ui.values[ 0 ] + " - " + ui.values[ 1 ] ));
      }
    });
    $( "#score-text" ).val(($( "#score-range" ).slider( "values", 0 ) +
      " - " + $( "#score-range" ).slider( "values", 1 ) ));
  } );

  $( function() {
    $( "#avg-score-range" ).slider({
      range: true,
      min: 1,
      max: 100,
      values: [ 50, 100 ],

      slide: function( event, ui ) {
        $( "#avg-score-text" ).val((ui.values[ 0 ] + " - " + ui.values[ 1 ] ));
      }
    });
    $( "#avg-score-text" ).val(($( "#avg-score-range" ).slider( "values", 0 ) +
      " - " + $( "#avg-score-range" ).slider( "values", 1 ) ));
  } );
  });
}

function getSettings(){
  var thisMatchBy;
  var tagArray = [];
  if ($('input[name=radio]:checked').val() == 'music-mode')
  {
    thisMatchBy = $("#settings-guess-music").val();
    $('.tags-checkbox:checkbox:checked').each(function() {
      tagArray.push(this.checked ? $(this).val() : "");
    });
  }

  if ($('input[name=radio]:checked').val() == 'anime-mode')
  {
    thisMatchBy = $("#settings-guess-anime").val();
    $('.tags-anime-checkbox:checkbox:checked').each(function() {
      tagArray.push(this.checked ? $(this).val() : "");
    });
  }

  console.log($('input[name=radio]:checked').val());
  var options = {
    mode:$('input[name=radio]:checked').val(),
    matchBy:thisMatchBy,
    songs:$( "#songs-range" ).slider( "values", 1 ),
    length:$( "#length-range" ).slider( "values", 1 ),
    importFromSpotify:document.getElementById('settings-import-spotify').checked,
    importFromAnilist:document.getElementById('settings-import-anilist').checked,
    difficultyMin:$( "#difficulty-range" ).slider( "values", 0 ),
    difficultyMax:$( "#difficulty-range" ).slider( "values", 1 ),
    scoreMin:$( "#score-range" ).slider( "values", 0 ),
    scoreMax:$( "#score-range" ).slider( "values", 1 ),
    oped: $('input[name=radio-oped]:checked').val(),
    avgScoreMin:$( "#avg-score-range" ).slider( "values", 0 ),
    avgScoreMax:$( "#avg-score-range" ).slider( "values", 1 ),
    ageMin:$( "#age-range" ).slider( "values", 0 ),
    ageMax:$( "#age-range" ).slider( "values", 1 ),
    tags: tagArray,
    importMode:$('input[name=radio-import]:checked').val(),
    presetId: selectedPresetId,
    customQuery: getQuery()
  };
  return options;
}

function finalizeSettings() {
  var options = getSettings();
  saveSettings(options);
  console.log(getQuery());
}

function getSettingsAsText(options) {
  var output='';

  //mode
  if (options.mode=='music-mode') {
    output+="Mode: Music\n";
    if (options.importFromSpotify) {
      output+="(Import your playlist from Spotify)\n";
      output+="Import mode: "+options.importMode.toProperCase()+"\n";
    }
  }

  if (options.mode=='anime-mode') {
    output+="Mode: Anime\n";
    if (options.importFromAnilist) {
      output+="(Import your list from Anilist)\n";
      output+="Import mode: "+options.importMode.toProperCase()+"\n";
    }
  }

  output+="\n-Round Options-\n";
  output+=("Match by: "+options.matchBy.toProperCase()+"\n");
  output+=("Number of rounds: "+options.songs+"\n");
  output+=("Round time limit: "+options.length+"\n");

  output+="\n-Filter Options-\n";
  output+=("Popularity: "+options.difficultyMin+'-'+options.difficultyMax+'\n');
  output+=("Year of release: "+options.ageMin+'-'+options.ageMax+'\n');
  if (options.mode=='anime-mode'){
    output+=("Openings/Endings: "+options.oped.toProperCase()+'\n');
    output+=("Average score: "+options.avgScoreMin+'-'+options.avgScoreMax+'\n');
    if (options.importFromAnilist)
      output+=("Player score: "+options.scoreMin+'-'+options.scoreMax+'\n');
  }
  if (options.mode=='music-mode' && options.tags.length != genres.length) {
    output+=(("Tags: "+options.tags).replace(/,/g, ",\t"));
  }
  if (options.mode=='anime-mode' && options.tags.length != genresAnime.length) {
    output+=(("Tags: "+options.tags).replace(/,/g, ",\t"));
  }

  return output;
}

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

/***********************************
*             FILTERS              *
***********************************/

function createRules(){
  $('#advanced-option-group').append(filterGroup.clone());
  $('#rule-button').remove();
  checkMode();
  refreshButtons();
}

function refreshButtons() {
  $('.filter-delete').click(function(){
    if($(this).parent().parent().children().length==3){
      $(this).parent().parent().remove();
    }

    if($(this).parent().parent().children('.filter, .filterGroup').length == 10){
      $(this).parent().parent().append(filterPlus.clone());
      refreshButtons();
    }

    $(this).parent().remove();

    if( $('#advanced-option-group').children().length == 0)
      $('#advanced-option-group').append("    <button id='rule-button' onclick='createRules()'>Create Rules</button>");
  });

  $('.filter-add').click(function(){
    $('.filter-add').off("click");
    var group = $(this).parent().parent();
    var text = $(this).text();
    $(this).parent().remove();

    if(text=='+'){
      if($('.filter').length<21) {
        group.append(filterElement.clone());
      }
    }

    else {
      if($('.filter-group').length<6) {
        var newgroup=filterGroup.clone();
        group.append(newgroup);
        if(group.css('background-color') == 'rgb(228, 228, 228)') {
          newgroup.css('background-color','#d0d0d0');
        }
      }
    }

    checkMode();

    if(group.children('.filter, .filterGroup').length < 5)
      group.append(filterPlus.clone());
    refreshButtons();
  });
}

function checkMode() {
  if ($('input[name=radio]:checked').val() == 'anime-mode') {
    $(".music-settings").css("display","none");
    $(".anime-settings").css("display","block");
  }
  else {
    $(".music-settings").css("display","block");
    $(".anime-settings").css("display","none");
  }
}

function getQuery() {
  if (($('#advanced-option-group > div')).length == 0) return undefined;

  var query = getQueryFromGroup(($('#advanced-option-group > div:first-child')),0).slice(0,-2);
  console.log(query);
  try{
    return JSON.parse('{"$match": '+query+'}');
  } catch(err) {return undefined;}

}

function getQueryFromGroup(object,t) {
  var tabs = "\t".repeat(t);
  var type = object.children('form').find('input:checked').val();
  var output = tabs + '{"' + type + '": [\n';
  object.children('.filter').each(function(){
    output += getQueryFromItem($(this),t+1)
  });
  object.children('.filter-group').each(function(){
    output += getQueryFromGroup($(this),t+1)
  });
  output = output.slice(0, -2) + '\n' + tabs + ']},\n';
  return output;
}

function getQueryFromItem(object,t){
  var tabs = "\t".repeat(t);
  var type;
  var output;
  //Get the selected type
  if ($('input[name=radio]:checked').val() == 'anime-mode') {
    type=object.children('.anime-settings').val();
  }
  else {
    type=object.children('.music-settings').val();
  }

  //Get the user input
  var input = object.children('input').val();

  //If the user wants an exact match
  if(object.children('select:last-of-type').val() == 'is') {
    return (tabs+'{"'+type+'": "'+input+'"},\n');
  }

  if(object.children('select:last-of-type').val() == 'is not') {
    return (tabs+'{"'+type+'": {"$not": {"$eq": "'+input+'"}}},\n');
  }

  if(object.children('select:last-of-type').val() == 'contains') {
    return (tabs+'{"'+type+'": {"$regex": "'+input+'", "$options": "i"}},\n');
  }

  return '\n';
}

/***********************************
*             PRESETS              *
***********************************/
function presetsLoaded() {
  $(".select-playlist-window").prepend($('<li class = "playlist-option" id="playlist-id-create">'));
  $('#playlist-id-create').append($('<div class="playlist-name">').text('Create').click(function() {
    $('.playlist-option-selected').removeClass('playlist-option-selected');
    $(this).parent().addClass('playlist-option-selected');
  }));
}

function savePreset(){
  var presetOptions = getSettings();
  var presetId = selectedPresetId;
  var presetName = $('#preset-name > input').val();
  $('.select-playlist').text($('#preset-name > input').val());
  sendPreset(presetOptions, presetId, presetName);
}

function presetResponse(options, isOwner){
  refreshSettings(options);
  if(isOwner){
    $('#preset-name').css('display','inline-flex');
  }
  else {
    $('#preset-name').css('display','none');
  }
}

function updatePresets(presets){
  refreshPresets(presets)
}

function refreshSettings(hostsettings) {
  selectedPresetId = hostsettings.presetId;
  $('#settings-select-mode').find('input[value="'+hostsettings.mode+'"]').prop("checked", true);
  $('.select-playlist').text(findNameById(hostsettings.presetId));
  $('#preset-name > input').val(findNameById(hostsettings.presetId));
  if(hostsettings.mode == 'music-mode')
    $('#settings-guess-music').val(hostsettings.matchBy);
  if(hostsettings.mode == 'anime-mode')
    $('#settings-guess-anime').val(hostsettings.matchBy);
  $('#settings-import-spotify').prop("checked", hostsettings.importFromSpotify);
  $('#settings-import-anilist').prop("checked", hostsettings.importFromAnilist);
  $('#settings-import-mode').find('input[value="'+hostsettings.importMode+'"]').prop("checked", true);
  $('#settings-import-mode').find('input[value="'+hostsettings.importMode+'"]').prop("checked", true);
    $('#settings-oped').find('input[value="'+hostsettings.oped+'"]').prop("checked", true);

  $('#songs-range').slider('value',hostsettings.songs);
  $( "#songs-text" ).val(($( "#songs-range" ).slider( "value")));

  $('#length-range').slider('value',hostsettings.length);
  $( "#length-text" ).val(($( "#length-range" ).slider( "value")));

  $('#difficulty-range').slider('values',0,hostsettings.difficultyMin);
  $('#difficulty-range').slider('values',1,hostsettings.difficultyMax);
  $( "#difficulty-text" ).val(($( "#difficulty-range" ).slider( "values", 0 ) +
    " - " + $( "#difficulty-range" ).slider( "values", 1 ) ));

  $('#age-range').slider('values',0,hostsettings.ageMin);
  $('#age-range').slider('values',1,hostsettings.ageMax);
  $( "#age-text" ).val(($( "#age-range" ).slider( "values", 0 ) +
    " - " + $( "#age-range" ).slider( "values", 1 ) ));

  $('#score-range').slider('values',0,hostsettings.scoreMin);
  $('#score-range').slider('values',1,hostsettings.scoreMax);
  $( "#score-text" ).val(($( "#score-range" ).slider( "values", 0 ) +
    " - " + $( "#score-range" ).slider( "values", 1 ) ));

  $('#avg-score-range').slider('values',0,hostsettings.avgScoreMin);
  $('#avg-score-range').slider('values',1,hostsettings.avgScoreMax);
  $( "#avg-score-text" ).val(($( "#avg-score-range" ).slider( "values", 0 ) +
    " - " + $( "#avg-score-range" ).slider( "values", 1 ) ));

  //Refresh the tags
  if(hostsettings.mode == 'music-mode') {
    $('#settings-select-tags').children().each(function() {
      if(hostsettings.tags.indexOf($(this).find('input').val()) > -1 ){
        $(this).find('input').prop("checked", true);
      }
      else {
        $(this).find('input').prop("checked", false);
      }
    });
  }
  if(hostsettings.mode == 'anime-mode') {
    $('#settings-select-tags-anime').children().each(function() {
      if(hostsettings.tags.indexOf($(this).find('input').val()) > -1 ){
        $(this).find('input').prop("checked", true);
      }
      else {
        $(this).find('input').prop("checked", false);
      }
    });
  }


  if (hostsettings.customQuery != undefined) {
    $('#advanced-option-group').empty();
    var group = hostsettings.customQuery.$match;
    for (query in group) {
      if(query=='$and'){
        addGroup(group[query],'$and',$('#advanced-option-group'));
      }
      if(query=='$or'){
        addGroup(group[query],'$or',$('#advanced-option-group'))
      }
    }
  }
  else{
    $('#advanced-option-group').empty();
    $('#advanced-option-group').append("    <button id='rule-button' onclick='createRules()'>Create Rules</button>");
  }


  function addGroup(thisgroup, andor, parent) {
    var groupobject = filterGroup.clone();
    parent.append(groupobject);
    if(parent.css('background-color') == 'rgb(228, 228, 228)') {
      groupobject.css('background-color','#d0d0d0');
    }
    groupobject.children('div').remove();
    groupobject.children('form').find('input[value="'+andor+'"]').prop("checked", true);

    thisgroup.forEach(function(item){

      var key;
      for (thiskey in item){
        key=thiskey;
      }

      if(key == '$and') {
        addGroup(item.$and,'$and',groupobject);
      }

      else if(key == '$or') {
        addGroup(item.$or,'$or',groupobject);
      }

      else {
        var itemObject = filterElement.clone();
        groupobject.append(itemObject);
        var val;
        var mode;

        if (item[key].$not != undefined){
          val = item[key].$not.$eq;
          mode = 'is not';
        }
        else if (item[key].$regex != undefined){
          val = item[key].$regex;
          mode = 'contains';
        }
        else {
          val = item[key];
          mode = 'is';
        }

        itemObject.find('input').val(val);
        itemObject.find('select:last-of-type').val(mode);

        if(hostsettings.mode=='music-mode'){
          itemObject.find('.music-settings').val(key);
        }

        else if(hostsettings.mode=='anime-mode'){
          itemObject.find('.anime-settings').val(key);
        }
      }
    });
    if(groupobject.children('.filter, .filterGroup').length < 10)
      groupobject.append(filterPlus.clone());
  }
  checkMode();
  refreshButtons();
}

function selectAll() {
  $('#settings-select-tags-anime').children().each(function() {
    $(this).find('input').prop("checked", true);
  });
  $('#settings-select-tags').children().each(function() {
    $(this).find('input').prop("checked", true);
  });
}

function updatePlaylistChoice(id) {
  if(id=='create'){
    $('#preset-name').css('display','inline-flex');
  }
  else {
    $('#preset-name').css('display','none');
    getPreset(id);
  }
}

function deselectAll() {
  $('#settings-select-tags-anime').children().each(function() {
    $(this).find('input').prop("checked", false);
  });
  $('#settings-select-tags').children().each(function() {
    $(this).find('input').prop("checked", false);
  });
}
