var players = {}

// the changing target color - starts as black
var targetColor = {
  'hue': 0, 
  'lightness': 0
};

// Update target color
function changeTargetColor() {
  // Change target color
  var stepSize = 8;
  targetColor.hue = Math.floor(Math.floor(Math.random() * 255) / stepSize) * stepSize;
  targetColor.lightness = Math.floor((Math.floor(Math.random() * 60) + 20) / stepSize) * stepSize; // 20-80% range
}

if (!this.navigator) { // determine whether this is a node module or inlined via script tag
  module.exports = {
    players: players,
    changeTargetColor: changeTargetColor,
    targetColor: targetColor
  }
}