  $(function () {

    $(window).on('load', function() {

      var socket = io();

      var gameId = null;
      var pairId = null;

      socket.on('gameStateUpdate', updateGameState);

      socket.on('gameCreated', updatePairId);

      var pairs;

      var games; //
      var bound = 15; //
      var minBound = 12; //

      var camera, scene, renderer, controls, targetBall, currentBall;

      var currentPosition, nextPosition;
      var lerpPercent = 0;

      var radius = 5;

      var lineDots = [];
      var numLineDots = 50;

      function updateGameState(gameState) {
        console.log('update game state');
        // update local state to match state on server
        games = gameState.games; //
        pairs = gameState.pairs;

        if (pairs && pairs[pairId]) {
          nextPosition = {
            'x': pairs[pairId].targetPoint.phi,
            'y': pairs[pairId].targetPoint.theta 
          }
          console.log('next position:');
          console.log(nextPosition);
        }

        // Draw

        // Set current ball position
        currentBall.position.setFromSphericalCoords(
          radius, 
          THREE.Math.degToRad(currentPosition.x), 
          THREE.Math.degToRad(currentPosition.y)
        );

        // Set target ball position
        targetBall.position.setFromSphericalCoords(
          radius, 
          THREE.Math.degToRad(nextPosition.x), 
          THREE.Math.degToRad(nextPosition.y)
        );

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
      /*function checkMatch() {
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
      }*/

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

        // Don't init until pair id is set
        init();
        animate();
      });

      function drawGame() {
        // draw stuff
        requestAnimationFrame(drawGame)
      }

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

        // current ball
        var geometry = new THREE.SphereGeometry( 1, 32, 32 );
        var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } ); // red
        currentBall = new THREE.Mesh( geometry, material );
        scene.add( currentBall );

        // target ball

        var geometry = new THREE.SphereGeometry( 1, 32, 32 );
        var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } ); // green
        targetBall = new THREE.Mesh( geometry, material );
        scene.add( targetBall );

        // TODO: rename x = phi, y = theta

        // in front of you
        currentPosition = {
          'x': -90,
          'y': 0
        }

        nextPosition = currentPosition;

        // Line between current and next position

        // Draw dotted line between current position and target

        // Array of dotted line balls

        // Initialize line dots and add to scene
        for (i = 0; i < numLineDots; i++) {
          var geometry = new THREE.SphereGeometry( .1, 32, 32 );
          var material = new THREE.MeshBasicMaterial( { color: 0x00ffff } ); // red
          lineDots[i] = new THREE.Mesh( geometry, material );
          scene.add( lineDots[i] );
        }

        // Blue circle
        var geometry = new THREE.SphereGeometry( 1, 32, 32 );
        var material = new THREE.MeshBasicMaterial( { color: 0x0000ff } ); // blue
        blueBall = new THREE.Mesh( geometry, material );
        blueBall.position.setFromSphericalCoords(
            radius, 
            -90, 
            10
          );
        scene.add( blueBall );

        // Yellow circle
        var geometry = new THREE.SphereGeometry( 1, 32, 32 );
        var material = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); // yellow
        yellowBall = new THREE.Mesh( geometry, material );
        yellowBall.position.setFromSphericalCoords(
            radius, 
            -90, 
            -10
          );
        scene.add( yellowBall );

        window.addEventListener( 'resize', onWindowResize, false );
      }

      var frameCount = 0;

      function animate() {

        window.requestAnimationFrame( animate );

        // Animate lines between dots

        for (i = 0; i < numLineDots; i++) {
          lerpPercent = 1/numLineDots * i + (frameCount % 50 * .002);

          // Set position of line dots
          lineDots[i].position.setFromSphericalCoords(
            radius, 
            THREE.Math.degToRad(currentPosition.x + ((nextPosition.x - currentPosition.x) * lerpPercent)), 
            THREE.Math.degToRad(currentPosition.y + ((nextPosition.y - currentPosition.y) * lerpPercent))
          );
        }

        controls.update();
        renderer.render( scene, camera );

        // Check frustum (whether object is in view)
        camera.updateMatrix();
        camera.updateMatrixWorld();

        var frustum = new THREE.Frustum();
        frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));  

        // Your 3d point to check
        var pos = new THREE.Vector3(targetBall.position.x, targetBall.position.y, targetBall.position.z);
        /*if (frustum.containsPoint(pos)) {
            // Do something with the position...
            console.log('IN VIEW');
            // communicate: matching
        } else {

        }*/

        var isMatching = frustum.containsPoint(pos);

        // Only send a socket signal + change screen state if match state has changed
        if (isMatching != prevIsMatching) {
          if (isMatching) {
              // Client has changed to match colors

              console.log('match');

              // Send match to socket
              socket.emit('matchPair', pairId);
          } else {
            // Client has changed to not match colors
            
            console.log('unmatch');

            // Send unmatch to socket
            socket.emit('unmatchPair', pairId);
          }

          prevIsMatching = isMatching;
        }

        //lerpPercent += .01;
        frameCount++;
      }

      function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

      }

      setInterval(gameLoop, 25)
      requestAnimationFrame(drawGame)

    });
  });