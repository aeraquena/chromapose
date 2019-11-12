  $(function () {

    // Puts hash in variable, and removes the # character
    var hash = window.location.hash.substring(1); 

    var socket = io();

    var gameId = null;
    var pairId = hash;

    socket.on('gameStateUpdate', updateGameState);

    socket.on('gameCreated', updatePairId);

    // User connects
    socket.on('userConnected', function() {
      console.log('user connected');
      
      // Check whether there's an active game
      if (pairId && role) {
        // Reconnect to the game
        socket.emit('reconnectPair', {'pairId': pairId, 'role': role});
      }
    });

    var pairs;

    var games;
    var bound = 15;
    var minBound = 12;

    var role = 0;
    var myTargetPoint;

    var diffVertical, diffHorizontal;

    var topMargin = 85;
    var bottomMargin = 90;

    var screenHeight = window.innerHeight - topMargin - bottomMargin;
    var screenWidth = window.innerWidth;

    var ballSize = 75;

    socket.emit('joinPair', hash);
    
    // Expand border
    $('#screen').addClass('game');

    // Show tutorial
    $('#tutorial').addClass('shown');

    function updateGameState(gameState) {
      // update local state to match state on server
      games = gameState.games;
      pairs = gameState.pairs;

      if (pairs && pairs[pairId] && pairs[pairId].players[socket.id]) {

        if (role == 0 && pairs[pairId].players[socket.id].role) {
          // Hide horizontal or vertical based on role
          role = pairs[pairId].players[socket.id].role;
          $('span.text-r').text(role);
          if (pairs[pairId].players[socket.id].role == 1) {
            $('#screen').addClass('horizontal');
            $('.instructions .instructions-orientation').text('SIDE TO SIDE');
            $('.instructions .instructions-orientation-partner').text('UP AND DOWN');
          } else {
            $('#screen').addClass('vertical');
            $('.instructions .instructions-orientation').text('UP AND DOWN');
            $('.instructions .instructions-orientation-partner').text('SIDE TO SIDE');
          }
        }

        if (myTargetPoint) {
          $('.ball.target.horizontal').css('left', screenWidth - (myTargetPoint.h * screenWidth) - ballSize/2);
          $('.ball.target.vertical').css('top', screenHeight - (myTargetPoint.v * screenHeight) - ballSize/2 + topMargin);
        }
      }
    }

    function updatePairId(game) {
      console.log('-- update game id --');
      if (game.socketId == socket.id) { 
        pairId = game.gameId;
      }
    }

    function gameLoop() {
      // Update game
      updateGameState({
        games: games,
        pairs: pairs
      })
    }

    /* Movement */

    // Local variables specific to player's device
    var rotDeg, leftRight, frontBack;

    var prevIsMatching = false;
    var prevImMatching = false;

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

    // Device orientation
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", function(event) {
            // alpha: rotation around z-axis
            rotDeg = event.alpha;
            // beta: front back motion
            frontBack = event.beta;
          
          // Determine how close it is to target

          // 0 - 1
          var scaleVertical = map(frontBack, -180, 180, 0, 1);
          var scaleHorizontal = map(rotDeg, 0, 360, 0, 1);

          // Front back rotation (around Y-axis)
          $('span.text-v').text(scaleVertical.toFixed(2));
          
          // Alpha rotation (around Z-axis)
          $('span.text-h').text(scaleHorizontal.toFixed(2));

          $('span.text-screen').text(screenWidth + ',' + screenHeight);

          if (pairs && pairs[pairId]) {

              // if player 2, calculate it - reflect it

              if (role == 2) {
                // rotate around .75
                // calculate distance from .75, then go in that other direction
                var diffFromNorth = .75 - pairs[pairId].targetPoint.v;
                var rawTargetPoint = .75 + diffFromNorth;
                if (rawTargetPoint > 1) {
                  rawTargetPoint = rawTargetPoint - 1;
                } else if ((rawTargetPoint < 0)) {
                  rawTargetPoint = rawTargetPoint + 1;
                }

                myTargetPoint = {
                  'v': rawTargetPoint,
                  'h': pairs[pairId].targetPoint.h
                };
              } else {
                myTargetPoint = pairs[pairId].targetPoint;
              }

            diffVertical = Math.abs(myTargetPoint.v - scaleVertical);
            diffHorizontal = Math.abs(myTargetPoint.h - scaleHorizontal)

            $('.ball.player.horizontal').css('left', screenWidth - (scaleHorizontal * screenWidth) - ballSize/2);
            $('.ball.player.vertical').css('top', screenHeight - (scaleVertical * screenHeight) - ballSize/2 + topMargin);

            if (pairs && pairId) {
              checkMatch();
            }

          }
        });
    }

    $(window).bind('orientationchange', function(e){
        var ori = window.orientation;
        if (ori == 90 || ori == -90) {
          // horizontal
          screenHeight = screen.width;
          screenWidth = screen.height;
        } else {
          // vertical
          screenHeight = screen.height;
          screenWidth = screen.width;
        }
    });

    // Checks match between target and user color
    // Both v and h are matching
    function checkMatch() {
      var bound = .1; // bounding box for ball matches

      // Player's visible axis is matching
      var imMatching = false;
      if ((role == 1 && diffHorizontal < bound) ||
        (role == 2 && diffVertical < bound)) {
        imMatching = true;
      }

      if (imMatching != prevImMatching) {
        if (imMatching) {
          $('#screen').addClass('match');
        } else {
          // Remove visual match indicator
          $('#screen').removeClass('match');
        }
        prevImMatching = imMatching;
      }

      var isMatching = imMatching; // TODO: Remove this

      // Only send a socket signal + change screen state if match state has changed
      if (isMatching != prevIsMatching) {
        if (isMatching) {
            // Client has changed to match colors

            // Add visual match indicator

            // Send match to socket
            socket.emit('matchPair', pairId);
        } else {
          // Client has changed to not match colors

          // Send unmatch to socket
          socket.emit('unmatchPair', pairId);
        }

        prevIsMatching = isMatching;
      }
    }

    // Animation when color changes
    var winTimeout;
    socket.on('pointChanged', function(changedGameId) {
      if (changedGameId == pairId) {
        clearTimeout(winTimeout);

        $('#screen').addClass('win');
        winTimeout = setTimeout(function() {
          $('#screen').removeClass('win');
        }, 750);
      }
    });
    function drawGame() {
      // draw stuff
      requestAnimationFrame(drawGame)
    }

    setInterval(gameLoop, 25)
    requestAnimationFrame(drawGame)
          
  });