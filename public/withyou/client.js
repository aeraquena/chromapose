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

      var diffVertical, diffHorizontal;

      // set ball size to screen height or width, whichever is greater
      //var ballSize = Math.max(screen.width, screen.height) / 10;
      //$('.ball').css('transform', 'scale(' + ballSize + ')');
      //$('.ball').css('height', ballSize);
      //$('.ball').css('border-radius', ballSize);

      function updateGameState(gameState) {
        // update local state to match state on server
        games = gameState.games; //
        pairs = gameState.pairs;

        /*if (pairs && pairs[pairId]) {
          nextPosition = {
            'x': pairs[pairId].targetPoint.phi,
            'y': pairs[pairId].targetPoint.theta 
          }
          //console.log('next position:');
          //console.log(nextPosition);
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

        $('.ball.target').css('left', pairs[pairId].targetPoint.h * 400);
        $('.ball.target').css('top', pairs[pairId].targetPoint.v * 400);
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

            // Front back rotation (around Y-axis)
            $('span.value.fb').text(frontBack.toFixed(2));
            $('#fb').width(frontBack + 180);

            // Alpha rotation (around Z-axis)
            $('span.value.rotdeg').text(rotDeg.toFixed(2));
            $('#rotdeg').width(rotDeg);

            // Determine how close it is to target

            // 0 - 1
            var scaleVertical = map(frontBack, -180, 180, 0, 1);// * ballSize;
            var scaleHorizontal = map(rotDeg, 0, 360, 0, 1);// * ballSize;

            // lightness = phi = vertical
            // hue = theta = horizontal

            if (pairs && pairs[pairId]) {

              diffVertical = Math.abs(pairs[pairId].targetPoint.v - scaleVertical);
              diffHorizontal = Math.abs(pairs[pairId].targetPoint.h - scaleHorizontal)

              // P1: Change size of circle based on Y
              // and closeness to target Y
              // scale = 100 * .01            
              
              $('.ball.vertical').css('transform', 'scale(' + diffVertical + ')');
              $('.ball.horizontal').css('transform', 'scale(' + diffHorizontal + ')');
              
              $('.ball.horizontal').css('left', scaleHorizontal * 400);
              $('.ball.vertical').css('top', scaleVertical * 400);

              //100 - (scaleVertical pairs[pairId].targetPoint.phi);

              //pairs[pairId].targetPoint.phi,
              //pairs[pairId].targetPoint.theta 

              // Change background color
              //$('#screen').css('background-color', 'hsl(' + hue + ', 100%, ' + lightness + '%)');

              if (pairs && pairId) {
                //console.log('call check match');
                checkMatch(scaleHorizontal, scaleVertical);
                // just check if both are 0

                // Send position to server - to check whether they're in sync
                //socket.emit('move', {'pairId': pairId, 'v': scaleVertical, 'h': scaleHorizontal});
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

        $('.ball').show();

        // Don't init until pair id is set
        //init();
        //animate();
      });

      function drawGame() {
        // draw stuff
        requestAnimationFrame(drawGame)
      }

      /*function init() {

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

        window.addEventListener( 'resize', onWindowResize, false );
      }

      var frameCount = 0;

      function animate() {

        window.requestAnimationFrame( animate );

        controls.update();
        renderer.render( scene, camera );

        // Check frustum (whether object is in view)
        camera.updateMatrix();
        camera.updateMatrixWorld();
      }

      function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

      }*/

      // Device orientation changes - regular, non three js

      setInterval(gameLoop, 25)
      requestAnimationFrame(drawGame)

    });
  });