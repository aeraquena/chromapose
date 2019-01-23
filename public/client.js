  $(function () {
    var socket = io();

    socket.on('gameStateUpdate', updateGameState);

    function updateGameState(gameState) {
      // update local state to match state on server
      players = gameState.players
      targetColor = gameState.targetColor
      matchingPlayers = gameState.matchingPlayers

      // Calculate matching players
      var playerCount = Object.keys(players).length
      var matchingPlayers = 0;
      Object.values(players).forEach((player, index) => {      
        if (player.matching) {
          matchingPlayers++;
        }
      })

      // Show matching players and total players
      document.getElementById('playerCount').innerHTML = String(matchingPlayers) + "/" + String(playerCount)

      // Change target border color
      $('#screen').css('border-color', 'hsl(' + targetColor.hue + ', 100%, ' + targetColor.lightness + '%)');
    }

    function gameLoop() {
      // update game
      updateGameState({
        players: players, 
        targetColor: targetColor,
        matchingPlayers: matchingPlayers})
    }

    /* Movement */

    // Local variables specific to player's device
    var rotDeg, leftRight, frontBack;
    var hue, lightness;

    var prevIsMatching = false;

    // Map value from one range onto another
    function map(value, xMin, xMax, yMin, yMax) { // stepSize, (yMax - yMin)/stepSize, mapped back... or %
      // try 64 colors. make sure it's divisible by 4
      // Clamp
      if (value < xMin) {
        return yMin;
      } else if (value > xMax) {
        return yMax;
      } else {
        var result = (value - xMin) * ((yMax - yMin)/(xMax - xMin)) + yMin;
        // Round to nearest step
        if (result / 4 != 0) {
          result = Math.floor(result/4) * 4;
        }
        return result;
      }
    }

    // Checks match between target and user color
    function checkMatch() {
      var bound = 10; // bounding box for color matches

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

    // Animation when color changes
    var winTimeout;
    socket.on('colorChanged', function() {
      clearTimeout(winTimeout);
      $('#screen').addClass('win');
      winTimeout = setTimeout(function() {
        $('#screen').removeClass('win');
      }, 750);
    });

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

            // Y = lightness
            // (Map front-back to lightness) + (Random 0-100) % 100
            // 20-80
            lightness = ((Math.floor(map(frontBack, -180, 180, 0, 60))) % 60) + 20;

            // Z = hue
            hue = (Math.floor(map(rotDeg, 0, 360, 255, 0))) % 255;

            // Change background color
            $('#screen').css('background-color', 'hsl(' + hue + ', 100%, ' + lightness + '%)');

            checkMatch(hue, lightness);
          }, true);
      }
    } else {
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

          checkMatch(hue, lightness);
      })
      var e = window.event;
    }

    // Show/hide instructions
    $('#instructionsLink').click(function() {
      if ($('#instructions').hasClass('shown')) {
        // hide
        $('#instructions').removeClass('shown');
        $(this).text('?');
      } else {
        // show
        $('#instructions').addClass('shown');
        $(this).text('X');
      }
    })

    function drawGame() {
      // draw stuff
      requestAnimationFrame(drawGame)
    }

    setInterval(gameLoop, 25)
    requestAnimationFrame(drawGame)
  });