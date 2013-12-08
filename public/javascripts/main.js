$(document).ready(function() {
  $("div#show li.song_list a").on("click", function() {
    var name = $(this).text();
    var link = $(this);
    $.post("/songs/search", {"name" : name}, function(data) {
      var mid = JSON.parse(data).mid;
      var key = JSON.parse(data).key;
      var sip = JSON.parse(data).sip;
      var url = "http://" + sip + "/M500" + mid + ".mp3?vkey=" + key + "&guid=1";
      console.log(url);
      $("#player").empty();
      $("<source src='" + url + "' type='audio/mpeg'>").appendTo($("#player"));
    });
  });
});