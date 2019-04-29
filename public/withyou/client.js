  $(function () {

    var socket = io();

    var gameId = null;
    var pairId = null;

    socket.on('gameStateUpdate', updateGameState);

    socket.on('gameCreated', updatePairId);

    var pairs;

    var games; //
    var bound = 15; //
    var minBound = 12; //

    function updateGameState(gameState) {
      // update local state to match state on server
      games = gameState.games; //
      pairs = gameState.pairs;

      // Calculate matching players
      /*if (games && games[gameId]) {
        var playerCount = Object.keys(games[gameId].players).length
        var matchingPlayers = 0;
        Object.values(games[gameId].players).forEach((player, index) => { // todo: get game id based on player     
          if (player.matching) {
            matchingPlayers++;
          }
        })
      }*/
    }

    //
    function updatePairId(pair) {
      console.log('-- update game id --');
      if (pair.socketId == socket.id) { 
        pairId = pair.pairId;
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
      //var bound = 12; // bounding box for color matches

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

    // A player moved, update their color
    /*socket.on('playerMoved', function(data) {
      console.log(data);
      console.log('player moved');
      // Same game, but not same player
      if (data.gameId == gameId && 
        data.socketId != socket.id) {
        console.log('other player moved');
        
        $('#partnerColor').css('background-color', 'hsl(' + data.z + ', 100%, ' + data.y + '%)');
      }
    });*/

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

            if (games && gameId) {
              checkMatch(hue, lightness);

              // Send position to server
              console.log('move');
              socket.emit('move', {'gameId': gameId, 'y': lightness, 'z': hue});
            }
          }); // ,true
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

          if (games && gameId) {
            checkMatch(hue, lightness);

            // Send position to server
            console.log('move');
            socket.emit('move', {'gameId': gameId, 'y': lightness, 'z': hue});
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
    /*$('#change-outer-color').click(function() {
      socket.emit('changeColor', gameId);
    });*/

    // end //

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
      //$('#top #gameId').text('#' + gameId);

      // Add user to game object players
      socket.emit('joinPair', gameId);
      // change to joinPair

      // Expand border
      $('#screen').addClass('game');

      // Show tutorial
      $('#tutorial').addClass('shown');
    });

    //
    // New game
    $('#new-game').click(function() {
      // Remove splash menu
      $('#splash').remove();

      // Show tutorial
      $('#tutorial').addClass('shown');

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

    $(window).on('load', function() {
      var camera, scene, renderer, controls, targetBall;

      var currentPosition, nextPosition;
      var lerpPercent = 0;

      var radius = 5;

      init();
      animate();

      function init() {

        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );

        controls = new THREE.DeviceOrientationControls( camera );

        scene = new THREE.Scene();

        // Sphere wireframe

        var geometry = new THREE.SphereBufferGeometry( 500, 30, 20 );
        // invert the geometry on the x-axis so that all of the faces point inward
        geometry.scale( - 1, 1, 1 );

        var material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } );

        var mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        // target ball

        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } ); // red
        targetBall = new THREE.Mesh( geometry, material );
        scene.add( targetBall );

        // TODO: rename x = phi, y = theta

        // in front of you
        currentPosition = {
          'x': -90,
          'y': 0
        }

        nextPosition = {
          'x': pairs[pairId].targetPoint.phi, //Math.floor(Math.random() * 180) + 180,
          'y': pairs[pairId].targetPoint.theta //Math.floor(Math.random() * 180) - 90
        }
        console.log('next position:');
        console.log(nextPosition);

        window.addEventListener( 'resize', onWindowResize, false );
      }

      function animate() {

        window.requestAnimationFrame( animate );

        if (lerpPercent >= 1) {
          currentPosition = nextPosition;

          // Generate new nextPosition, coordinates between -5 and 5
          // TODO: Get this from server
          nextPosition = {
            'x': Math.floor(Math.random() * 180) + 180,
            'y': Math.floor(Math.random() * 180) - 90
          }

          lerpPercent = 0;
        }

        targetBall.position.setFromSphericalCoords(
          radius, 
          THREE.Math.degToRad(currentPosition.x + ((nextPosition.x - currentPosition.x) * lerpPercent)), 
          THREE.Math.degToRad(currentPosition.y + ((nextPosition.y - currentPosition.y) * lerpPercent))
        );

        controls.update();
        renderer.render( scene, camera );

        // Check frustum (whether object is in view)
        camera.updateMatrix();
        camera.updateMatrixWorld();

        var frustum = new THREE.Frustum();
        frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));  

        // Your 3d point to check
        var pos = new THREE.Vector3(targetBall.position.x, targetBall.position.y, targetBall.position.z);
        if (frustum.containsPoint(pos)) {
            // Do something with the position...
            console.log('IN VIEW');
        } else {
          console.log('---');
        }

        lerpPercent += .01;
      }

      function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

      }
    });

    setInterval(gameLoop, 25)
    requestAnimationFrame(drawGame)
  });