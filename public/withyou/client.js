  $(function () {

    //$(window).on('load', function() {

      var socket = io();

      var gameId = null;
      var pairId = null;

      socket.on('gameStateUpdate', updateGameState);

      socket.on('gameCreated', updatePairId);

      var pairs;

      var games; //
      var bound = 15;
      var minBound = 12;

      var role = 0;
      var myTargetPoint;

      var diffVertical, diffHorizontal;

      function updateGameState(gameState) {
        // update local state to match state on server
        games = gameState.games; //
        pairs = gameState.pairs;

        if (pairs && pairs[pairId]) {

          if (!role) {
            // Hide horizontal or vertical based on role
            role = pairs[pairId].players[socket.id].role;
            $('span.text-r').text(role);
            if (pairs[pairId].players[socket.id].role == 1) {
              $('#screen').addClass('horizontal');
            } else {
              $('#screen').addClass('vertical');
            }
          }

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

          $('.ball.target.horizontal').css('left', myTargetPoint.h * 400);
          $('.ball.target.vertical').css('top', myTargetPoint.v * 400);
        }
      }

      //
      function updatePairId(game) {
        console.log('-- update game id --');
        if (game.socketId == socket.id) { 
          pairId = game.gameId;
        }
      }

      function gameLoop() {
        // update game
        updateGameState({
          games: games, //
          pairs: pairs
        })
      }

      //
      /* Movement */

      // Local variables specific to player's device
      var rotDeg, leftRight, frontBack;
      //var hue, lightness;

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

            if (pairs && pairs[pairId]) {

              diffVertical = Math.abs(myTargetPoint.v - scaleVertical);
              diffHorizontal = Math.abs(myTargetPoint.h - scaleHorizontal)

              $('.ball.player.horizontal').css('left', 400 - (scaleHorizontal * 400));
              $('.ball.player.vertical').css('top', 400 - (scaleVertical * 400));

              if (pairs && pairId) {
                checkMatch();
              }

            }
          });
      }

      // Checks match between target and user color
      // Both v and h are matching
      function checkMatch() {
        //console.log('check match');
        var bound = .12; // bounding box for color matches

        var isMatching = (diffVertical < bound) && (diffHorizontal < bound);

        // Only send a socket signal + change screen state if match state has changed
        if (isMatching != prevIsMatching) {
          if (isMatching) {
              // Client has changed to match colors

              // Add visual match indicator
              //$('#screen').addClass('match');

              // Send match to socket
              console.log('MATCH');
              socket.emit('matchPair', pairId);
          } else {
            // Client has changed to not match colors
            
            // Remove visual match indicator
            //$('#screen').removeClass('match');

            // Send unmatch to socket
            console.log('UNMATCH');
            socket.emit('unmatchPair', pairId);
          }

          prevIsMatching = isMatching;
        }
      }

      // Animation when color changes
      /*var winTimeout;
      socket.on('pointChanged', function(changedGameId) {
        if (changedGameId == pairId) {
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
      });*/

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

        // Remove splash menu
        $('#splash').remove();

        // Add user to game object players
        socket.emit('joinPair', pairId);

        // Expand border
        $('#screen').addClass('game');

        // Show tutorial
        $('#tutorial').addClass('shown');
      });

      function drawGame() {
        // draw stuff
        requestAnimationFrame(drawGame)
      }

      setInterval(gameLoop, 25)
      requestAnimationFrame(drawGame)

    //});
  });