  $(function () {
    var socket = io();

    var gameId = null;

    socket.on('gameStateUpdate', updateGameState);

    socket.on('gameCreated', updateGameId);

    function updateGameState(gameState) {
      // update local state to match state on server
      games = gameState.games

      // Calculate matching players
      if (games[gameId]) {
        console.log('target color: ' + games[gameId].targetColor.hue + ', ' + games[gameId].targetColor.lightness);

        var playerCount = Object.keys(games[gameId].players).length
        var matchingPlayers = 0;
        Object.values(games[gameId].players).forEach((player, index) => { // todo: get game id based on player     
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
      // TODO: Pass in game id

      var bound = 10; // bounding box for color matches

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
          console.log('Client unmatch, game id: ' + gameId);
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
        }, 750);
      }
    });

    window.addEventListener("deviceorientation", function(event) {
      console.log(event);
    });

    // Detect if browser supports orientation
    if (typeof window.orientation !== 'undefined') { 
      console.log('Mobile');
      // Mobile

      // Device orientation
      if (window.DeviceOrientationEvent) {
        console.log('device orientation event');
          window.addEventListener("deviceorientation", function(event) {
            console.log(event);
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

            if (gameId) {
              checkMatch(hue, lightness);
            }
          }); // ,true
      }
    } else {
      console.log('Desktop');
      // Desktop
      $('#content').css('font-size', '18px');

      var bodyWidth = $('body').width();
      var bodyHeight = $('body').height();

      $("body").mousemove(function(e) {

          hue = (Math.floor(map(e.pageX, 0, bodyWidth, 255, 0))) % 255;
          lightness = (Math.floor(map(e.pageY, 0, bodyHeight, 0, 80)) % 80) + 20;

          // Change color
          $('#hue').text(hue);
          $('#lightness').text(lightness);

          // Change background color
          $('#screen').css('background-color', 'hsl(' + hue + ', 100%, ' + lightness + '%)');

          if (gameId) {
            checkMatch(hue, lightness);
          }
      })
      var e = window.event;
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
    });

    // New game
    $('#new-game').click(function() {
      // Remove splash menu
      $('#splash').remove();

      // Create new game object
      // Add user to game object players
      //socket.emit('join', gameId);
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