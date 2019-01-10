  $(function () {
    var socket = io();

    socket.on('gameStateUpdate', updateGameState);

    function updateGameState(gameState) {
      // update local state to match state on server
      players = gameState.players
      targetColor = gameState.targetColor

      // Calculate matching players
      var playerCount = Object.keys(players).length
      
      // Show total players
      document.getElementById('playerCount').innerHTML = String(playerCount)

      // Change target border color
      $('#screen').css('border-color', 'hsl(' + targetColor.hue + ', 100%, ' + targetColor.lightness + '%)');
    }

    function gameLoop() {
      // update game
      updateGameState({
        players: players, 
        targetColor: targetColor
      })
    }

    var borderTimeout;
    socket.on('colorChanged', function() {
      clearTimeout(borderTimeout);
      $('#screen').addClass('lose');
      borderTimeout = setTimeout(function() {
        $('#screen').removeClass('lose');
      }, 500);
    });
    
    /* Movement */

    // Local variables specific to player's device
    var rotDeg, leftRight, frontBack;
    var hue, lightness;

    var prevIsMatching = false;
    var score = 0;

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

    var scoreTimeout;

    // Checks match between target and user color
    function checkMatch() {
      var bound = 15; // TODO: make global constant

      // Is player within the target color bounds?
      var isMatching = hue > (targetColor.hue - bound) && hue < (targetColor.hue + bound) &&
        lightness > (targetColor.lightness - bound) && lightness < (targetColor.lightness + bound);

      // Only send a socket signal + change screen state if match state has changed
      if (isMatching != prevIsMatching) {
        if (isMatching) {
            // Client has changed to match colors

            clearTimeout(scoreTimeout);
            // Update local score
            score++;
            // Win state
            $('#screen').addClass('match');
            $('#score').text(score).addClass('scored');
            scoreTimeout = setTimeout(function() {
              $('#screen').removeClass('match');
              $('#score').removeClass('scored');
            }, 500);

            // Send match to socket
            socket.emit('match', players);
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

            // Y = lightness
            // (Map front-back to lightness) + (Random 0-100) % 100
            // 20-80
            lightness = ((Math.floor(map(frontBack, -180, 180, 0, 60))) % 60) + 20;

            // Z = hue
            hue = (Math.floor(map(rotDeg, 0, 360, 0, 255))) % 255;

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

          hue = (Math.floor(map(e.pageX, 0, bodyWidth, 0, 255))) % 255;
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