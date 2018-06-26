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
  'blues'
];
var canImport = false;

function settingsContainer(container) {
  $.get("/scripts/settings.html", function(data){
    document.getElementById(container).innerHTML=data;

    genres.forEach(function(genre){
      var tagName=genre.replace(" ","_");
      $('#settings-select-tags').append($("<label id='settings-tag-"+tagName+"' class='checkboxcontainer'>").text(genre.toProperCase()));

      $('#settings-tag-'+tagName).append('<input value="'+genre+'" type="checkbox" checked="checked" class="tags-checkbox">');
      $('#settings-tag-'+tagName).append('<span class="checkboxmark"></span>');
    });

    $("#music-mode").click(function() {
      $(".music-settings").css("display","block");
      $(".anime-settings").css("display","none");
      updateImport();
    });

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
      if (( (($('input[name=radio]:checked').val() == 'music-mode')) &&
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
      range: false,
      min: 0,
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
      range: false,
      min: 0,
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
      values: [ 0, 100],

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
      max: 10,
      values: [ 1, 10 ],

      slide: function( event, ui ) {
        $( "#score-text" ).val((ui.values[ 0 ] + " - " + ui.values[ 1 ] ));
      }
    });
    $( "#score-text" ).val(($( "#score-range" ).slider( "values", 0 ) +
      " - " + $( "#score-range" ).slider( "values", 1 ) ));
  } );
  });
}

function finalizeSettings() {
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
  }

  console.log($('input[name=radio]:checked').val());
  var options = {
    mode:$('input[name=radio]:checked').val(),
    matchBy:thisMatchBy,
    songs:$( "#songs-range" ).slider( "value"),
    length:$( "#length-range" ).slider( "value"),
    importFromSpotify:document.getElementById('settings-import-spotify').checked,
    importFromAnilist:document.getElementById('settings-import-anilist').checked,
    difficultyMin:$( "#difficulty-range" ).slider( "values", 0 ),
    difficultyMax:$( "#difficulty-range" ).slider( "values", 1 ),
    scoreMin:$( "#score-range" ).slider( "values", 0 ),
    scoreMax:$( "#score-range" ).slider( "values", 1 ),
    ageMin:$( "#age-range" ).slider( "values", 0 ),
    ageMax:$( "#age-range" ).slider( "values", 1 ),
    tags: tagArray,
    importMode:$('input[name=radio-import]:checked').val(),
  };
  saveSettings(options);
}

function getSettingsAsText(options) {
  var output='';

  //mode
  if (options.mode=='music-mode') {
    output+="Mode: Music\n";
    if (options.importFromSpotify) output+="(Import your playlist from Spotify)\n";
  }

  if (options.mode=='anime-mode') {
    output+="Mode: Anime\n";
    if (options.importFromAnilist) output+="(Import your list from Anilist)\n";
  }

  output+="\n-Round Settings-\n";
  output+=("Match by: "+options.matchBy.toProperCase()+"\n");
  output+=("Number of rounds: "+options.songs+"\n");
  output+=("Round time limit: "+options.songs+"\n");

  output+="\n-Sort Settings-\n";
  output+=("Popularity: "+options.difficultyMin+'-'+options.difficultyMax+'\n');
  output+=("Year of release: "+options.ageMin+'-'+options.ageMax+'\n');
  if (options.mode=='anime-mode' && options.importFromAnilist) {
    output+=("Player score: "+options.scoreMin+'-'+options.scoreMax+'\n');
  }
  if (options.mode=='music-mode' && options.tags.length != genres.length) {
    output+=(("Tags: "+options.tags).replace(/,/g, ",\t"));
  }


  return output;
}

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};
