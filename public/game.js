var players = {}
var doubloon = {} // the thing everyone's chasing

const gameSize = 2500; // will be downscaled 5x to 500x500 when we draw

const playerSize = 100; // (downscaled to 20x20)
const doubloonSize = 50
const maxAccel = 10

// the changing target color. hardcoded to red for now
var targetColor = {
  'hue': 0, 
  'lightness': 0
};

function checkCollision(obj1, obj2) {
  // TODO: Check whether color is in range of target color? or just listen for TRUE from client?
  return(Math.abs(obj1.x - obj2.x) <= playerSize && Math.abs(obj1.y - obj2.y) <= playerSize)
}

function isValidPosition(newPosition, playerId) {
  // bounds check
  if (newPosition.x < 0 || newPosition.x + playerSize > gameSize) {
    return false
  }
  if (newPosition.y < 0 || newPosition.y + playerSize > gameSize) {
    return false
  }
  // collision check
  var hasCollided = false


  Object.keys(players).forEach((key) => {
    if (key == playerId) { return } // ignore current player in collision check
    player = players[key]
    // if the players overlap. hope this works
    if (checkCollision(player, newPosition)) {
      hasCollided = true
      return // don't bother checking other stuff
    }
  })
  if (hasCollided) {
    return false
  }

  return true
}

// Update target color
function shuffleDoubloon() {

  // Generates a target color
  /* targetHue = Math.floor(Math.random() * 255);
  targetSaturation = Math.floor(Math.random() * 100);
  targetLightness = Math.floor(Math.random() * 100);
  */

  var posX = Math.floor(Math.random() * Number(gameSize) - 100) + 10
  var posY = Math.floor(Math.random() * Number(gameSize) - 100) + 10

  while (!isValidPosition({ x: posX, y: posY }, '_doubloon')) {
    posX = Math.floor(Math.random() * Number(gameSize) - 100) + 10
    posY = Math.floor(Math.random() * Number(gameSize) - 100) + 10
  }

  console.log('-- shuffle doubloon --');
  //console.log(posX);
  //console.log(posY);

  doubloon.x = posX
  doubloon.y = posY

  // Change target color
  //targetColor.hue = Math.floor(map(doubloon.x, 0, 2400, 0, 255));
  //targetColor.lightness = Math.floor(map(doubloon.y, 0, 2400, 0, 100));
  targetColor.hue = Math.floor(Math.random() * 255);
  targetColor.lightness = Math.floor(Math.random() * 80) + 20; // 20-80
}

function movePlayer(id) {

  var player = players[id]

  var newPosition = {
    x: player.x + player.accel.x,
    y: player.y + player.accel.y
  }
  if (isValidPosition(newPosition, id)) {
    // move the player and increment score
    player.x = newPosition.x
    player.y = newPosition.y
  } else {
    // don't move the player
    // kill accel
    player.accel.x = 0
    player.accel.y = 0
  }

  // Change shuffleDoubloon to be called when player reaches MATCH
  if (checkCollision(player, doubloon)) {
    player.score += 1
    shuffleDoubloon()
  }
}

function accelPlayer(id, x, y) {
  var player = players[id]
  var currentX = player.accel.x
  var currentY = player.accel.y

  // set direction stuff - only used for UI
  if (x > 0) {
    player.direction = 'right'
  } else if (x < 0) {
    player.direction = 'left'
  } else if (y > 0) {
    player.direction = 'down'
  } else if (y < 0) {
    player.direction = 'up'
  }

  if (Math.abs(currentX + x) < maxAccel) {
    player.accel.x += x
  }
  if (Math.abs(currentY + y) < maxAccel) {
    player.accel.y += y
  }
}

// thanks SO
function stringToColour(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}

if (!this.navigator) { // super hacky thing to determine whether this is a node module or inlined via script tag
  module.exports = {
    players: players,
    stringToColour: stringToColour,
    accelPlayer: accelPlayer,
    movePlayer: movePlayer,
    playerSize: playerSize,
    gameSize: gameSize,
    isValidPosition: isValidPosition,
    doubloon: doubloon,
    shuffleDoubloon: shuffleDoubloon,
    targetColor: targetColor
  }
}
