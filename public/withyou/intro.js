$(function () {
  // Intro screen

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
    console.log('click');
    pairId = $('#input-number').val();
    window.location.href = '/game.html#' + pairId;
  });
});