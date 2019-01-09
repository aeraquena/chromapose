  $(function () {
    var socket = io();

    // remove
    var localDirection // used to display accel direction

    socket.on('gameStateUpdate', updateGameState);

    function drawPlayers(players) {
      // draw players
      // the game world is 500x500, but we're downscaling 5x to smooth accel out
      Object.keys(players).forEach((playerId) => {
        let player = players[playerId]
        var direction

        if (playerId == socket.id) {
          direction = localDirection
        } else {
          direction = player.direction
        }
      })
    }

    function updateGameState(gameState) {
      // update local state to match state on server
      players = gameState.players
      doubloon = gameState.doubloon
      targetColor = gameState.targetColor
      matchingPlayers = gameState.matchingPlayers
      // draw stuff


      // set score info
      var playerCount = Object.keys(players).length
      var matchingPlayers = 0;
      Object.values(players).sort((a,b) => (b.score - a.score)).forEach((player, index) => {      
        if (player.matching) {
          matchingPlayers++;
        }
      })

      document.getElementById('playerCount').innerHTML = String(matchingPlayers) + " / " + String(playerCount)

      // Change target border color

      $('#screen').css('border-color', 'hsl(' + targetColor.hue + ', 100%, ' + targetColor.lightness + '%)');
      $('#targetHue').text(targetColor.hue);
      $('#targetLightness').text(targetColor.lightness);

      drawPlayers(players)
    }

    function gameLoop() {
      // update game
      updateGameState({
        players: players, 
        doubloon: doubloon, 
        targetColor: targetColor,
        matchingPlayers: matchingPlayers})
      // move everyone around
      Object.keys(players).forEach((playerId) => {
        let player = players[playerId]
        movePlayer(playerId)
      })
    }

    // Begin Chromapose
    // MOVEMENT

    // Local variables specific to player's device
    var rotDeg, leftRight, frontBack;
    var hue, saturation, lightness;
    saturation = 50; // temporary
    var targetHue, targetSaturation, targetLightness; // unused

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
      var bound = 12; // TODO: make global constant

      // Is player within the target color bounds?
      var isMatching = hue > (targetColor.hue - bound) && hue < (targetColor.hue + bound) &&
        lightness > (targetColor.lightness - bound) && lightness < (targetColor.lightness + bound);

        // Only send a socket signal + change screen state if match state has changed
      if (isMatching != prevIsMatching) {
        if (isMatching) {
            // Client has changed to match colors

            // Add visual match indicator
            $('#screen').addClass('match');

            // Send match to socket
            socket.emit('match', players);
        } else {
          // Client has changed to not match colors
          
          // Remove visual match indicator
          $('#screen').removeClass('match');

          // Send unmatch to socket
          socket.emit('unmatch', players);
        }

        prevIsMatching = isMatching;
      }
    }

    // Detect if browser supports orientation
    if (typeof window.orientation !== 'undefined') { 
      // Mobile

      // Device orientation
      if (window.DeviceOrientationEvent) {
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

            // X = saturation
            //saturation = Math.floor(map(leftRight, -90, 90, 0, 100));

            // Y = lightness
            // (Map front-back to lightness) + (Random 0-100) % 100
            // 20-80
            lightness = ((Math.floor(map(frontBack, -180, 180, 0, 80))) % 80) + 20;

            // Z = hue
            hue = (Math.floor(map(rotDeg, 0, 360, 0, 255))) % 255;

            // Change color
            $('#hue').text(hue);
            $('#saturation').text(saturation);
            $('#lightness').text(lightness);

            // Change background color
            $('#screen').css('background-color', 'hsl(' + hue + ', ' + saturation + '%, ' + lightness + '%)');

            checkMatch(hue, lightness);
          }, true);
      }
    } else {
      // Desktop
      $('#content').css('font-size', '18px');

      var bodyWidth = $('body').width();
      var bodyHeight = $('body').height();

      $("body").mousemove(function(e) {

          hue = (Math.floor(map(e.pageX, 0, bodyWidth, 0, 255))) % 255;
          lightness = (Math.floor(map(e.pageY, 0, bodyHeight, 0, 80)) % 80) + 20;

          // Change color
          $('#hue').text(hue);
          $('#lightness').text(lightness);

          // Change background color
          $('#screen').css('background-color', 'hsl(' + hue + ', 50%, ' + lightness + '%)');

          checkMatch(hue, lightness);
      })
      var e = window.event;
    }

    function drawGame() {
      // draw stuff
      drawPlayers(players)
      requestAnimationFrame(drawGame)
    }

    setInterval(gameLoop, 25)
    requestAnimationFrame(drawGame)

  });
