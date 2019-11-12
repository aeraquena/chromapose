  $(function () {

    var socket = io();

    var gameId = null;

    socket.on('gameStateUpdate', updateGameState);

    socket.on('gameCreated', updateGameId);

    // User connects
    socket.on('userConnected', function() {
      console.log('user connected');
      
      // Check whether there's an active game
      if (gameId) {
        // Reconnect to the game
        socket.emit('reconnection', gameId);
      }
    });

    var games;
    var bound = 15;
    var minBound = 12;

    function updateGameState(gameState) {
      // update local state to match state on server
      games = gameState.games;

      // Calculate matching players
      if (games && games[gameId]) {
        var playerCount = Object.keys(games[gameId].players).length
        var matchingPlayers = 0;
        Object.values(games[gameId].players).forEach((player, index) => {  
          if (player.matching) {
            matchingPlayers++;
          }
        })

        // Show matching players and total players
        document.getElementById('playerCount').innerHTML = String(matchingPlayers) + "/" + String(playerCount)

        // Change target border color
        $('#screen').css(
          'border-color', 
          'hsl(' + games[gameId].targetColor.hue + 
          ', 100%, ' + games[gameId].targetColor.lightness + '%)');
      }
    }

    function updateGameId(game) {
      console.log('-- update game id --');
      if (game.socketId == socket.id) { 
        $('#top #gameId').text('#' + game.gameId);
        gameId = game.gameId;
      }
    }

    function gameLoop() {
      // update game
      updateGameState({
        games: games
      })
    }

    /* Movement */

    // Local variables specific to player's device
    var rotDeg, leftRight, frontBack;
    var hue, lightness;

    var prevIsMatching = false;

    // Map value from one range onto another
    function map(value, xMin, xMax, yMin, yMax) {
      // Clamp
      if (value < xMin) {
        return yMin;
      } else if (value > xMax) {
        return yMax;
      } else {
        var result = (value - xMin) * ((yMax - yMin)/(xMax - xMin)) + yMin;
        return result;
      }
    }

    // Checks match between target and user color
    function checkMatch() {
      // Is player within the target color bounds?
      var isMatching = hue > (games[gameId].targetColor.hue - bound) && hue < (games[gameId].targetColor.hue + bound) &&
        lightness > (games[gameId].targetColor.lightness - bound) && lightness < (games[gameId].targetColor.lightness + bound);

      // Only send a socket signal + change screen state if match state has changed
      if (isMatching != prevIsMatching) {
        if (isMatching) {
            // Client has changed to match colors

            // Add visual match indicator
            $('#screen').addClass('match');

            // Send match to socket
            socket.emit('match', gameId);
        } else {
          // Client has changed to not match colors
          
          // Remove visual match indicator
          $('#screen').removeClass('match');

          // Send unmatch to socket
          socket.emit('unmatch', gameId);
        }

        prevIsMatching = isMatching;
      }
    }

    // Animation when color changes
    var winTimeout;
    socket.on('colorChanged', function(changedGameId) {
      if (changedGameId == gameId) {
        clearTimeout(winTimeout);
        $('#screen').addClass('win');
        winTimeout = setTimeout(function() {
          $('#screen').removeClass('win');

          // Remove tutorial
          $('#tutorial').remove();
        }, 750);

        // Decrease bound until it reaches min bound
        if (bound > minBound) {
          bound--;
        }
      }
    });

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      $('#request-permission').click(function() {

        $('#page').removeClass('motion-off');

        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response == 'granted') {
              window.addEventListener("deviceorientation", function(event) {
                // alpha: rotation around z-axis
                rotDeg = event.alpha;
                // gamma: left to right
                leftRight = event.gamma;
                // beta: front back motion
                frontBack = event.beta;

                // Left right rotation (around X-axis)
                $('span.value.lr').text(leftRight.toFixed(2));
                $('#lr').width(leftRight + 90);

                // Front back rotation (around Y-axis)
                $('span.value.fb').text(frontBack.toFixed(2));
                $('#fb').width(frontBack + 180);

                // Alpha rotation (around Z-axis)
                $('span.value.rotdeg').text(rotDeg.toFixed(2));
                $('#rotdeg').width(rotDeg);

                // Y = lightness
                // (Map front-back to lightness) + (Random 0-100) % 100
                // 20-80
                lightness = ((Math.floor(map(frontBack, -180, 180, 0, 60))) % 60) + 20;

                // Z = hue
                hue = (Math.floor(map(rotDeg, 0, 360, 255, 0))) % 255;

                // Change background color
                $('#screen').css('background-color', 'hsl(' + hue + ', 100%, ' + lightness + '%)');

                if ($('#page').hasClass('motion-off')) {
                  $('#page').removeClass('motion-off');
                }

                if (games && gameId) {
                  checkMatch(hue, lightness);
                }
              });
            }
          })
          .catch(console.error);
      });
    } else {
      // Non iOS 13+
      $('#page').removeClass('motion-off');
      
      window.addEventListener("deviceorientation", function(event) {
        // alpha: rotation around z-axis
        rotDeg = event.alpha;
        // gamma: left to right
        leftRight = event.gamma;
        // beta: front back motion
        frontBack = event.beta;

          // Left right rotation (around X-axis)
        $('span.value.lr').text(leftRight.toFixed(2));
        $('#lr').width(leftRight + 90);

        // Front back rotation (around Y-axis)
        $('span.value.fb').text(frontBack.toFixed(2));
        $('#fb').width(frontBack + 180);

        // Alpha rotation (around Z-axis)
        $('span.value.rotdeg').text(rotDeg.toFixed(2));
        $('#rotdeg').width(rotDeg);

        // Y = lightness
        // (Map front-back to lightness) + (Random 0-100) % 100
        // 20-80
        lightness = ((Math.floor(map(frontBack, -180, 180, 0, 60))) % 60) + 20;

        // Z = hue
        hue = (Math.floor(map(rotDeg, 0, 360, 255, 0))) % 255;

        // Change background color
        $('#screen').css('background-color', 'hsl(' + hue + ', 100%, ' + lightness + '%)');

        if ($('#page').hasClass('motion-off')) {
          $('#page').removeClass('motion-off');
        }

        if (games && gameId) {
          checkMatch(hue, lightness);
        }
      });
    }

    // Show/hide instructions
    $('#instructionsLink').click(function() {
      if ($('#instructions').hasClass('shown')) {
        // hide
        $('#instructions').removeClass('shown');
        $('#splash').show();
        $(this).text('?');
      } else {
        // show
        $('#instructions').addClass('shown');
        $('#splash').hide();
        $(this).text('X');
      }
    });

    // Change outer color manually
    $('#change-outer-color').click(function() {
      socket.emit('changeColor', gameId);
    });

    // Join game
    $('#join-game').click(function() {
      $('#splash #start-buttons').hide();
      $('#splash #input-number-container').show();
    });

    $('#input-number').on('blur', function() {
      // Scroll down to bottom
      $("#splash").animate({scrollTop: $('#splash').height() - $('#join-game-number').height()});
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
      gameId = $('#input-number').val();

      // Remove splash menu
      $('#splash').remove();

      // Add game ID to display
      $('#top #gameId').text('#' + gameId);

      // Add user to game object players
      socket.emit('join', gameId);

      // Expand border
      $('#screen').addClass('game');

      // Show tutorial
      $('#tutorial').addClass('shown');
    });

    // New game
    $('#new-game').click(function() {
      // Remove splash menu
      $('#splash').remove();

      // Show tutorial
      $('#tutorial').addClass('shown');

      // Create new game object
      // Add user to game object players
      socket.emit('newGame');

      // Expand border
      $('#screen').addClass('game');
    });

    function drawGame() {
      // draw stuff
      requestAnimationFrame(drawGame)
    }

    setInterval(gameLoop, 25)
    requestAnimationFrame(drawGame)
  });