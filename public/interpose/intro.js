$(function () {
  // Intro screen

  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    $('#request-permission').click(function() {

      $('body').removeClass('motion-off');

      DeviceOrientationEvent.requestPermission().then(response => {
        if (response == 'granted') {
            window.addEventListener("deviceorientation", function(event) {
            });
          }
        });
      });
  } else {
    $('body').removeClass('motion-off');
  }

  var pairId;

  // Join game
  $('#join-game').click(function() {
    $('#splash #start-buttons').hide();
    $('#splash #input-number-container').show();
  });

  $('#input-number').on('cut keyup paste', function() {
    if ($('#input-number').val()) {
      $('#join-game-number').css('display', 'block');
    } else {
      $('#join-game-number').hide();
    }
  });

  // Join game number
  $('#join-game-number').click(function() {
    pairId = $('#input-number').val();
    pairId = pairId.toLowerCase();
    $('#part-1').remove();
    $(window).scrollTop(0);
    $('#part-2').show();
  });

  $(document).on('click', '#done', function(){
    $('#part-2').remove();
    $(window).scrollTop(0);
    $('#part-3').show();

    setTimeout(function() {
      document.location.replace('game.html#' + pairId);
    }, 750);
  });
});