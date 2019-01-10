var players = {}

// the changing target color - starts as black
var targetColor = {
  'hue': 0, 
  'lightness': 0
};

// Update target color
function changeTargetColor() {
  // Change target color
  targetColor.hue = Math.floor(Math.random() * 255);
  targetColor.lightness = Math.floor(Math.random() * 60) + 20; // 20-80% range
  $('screen').addClass('animated');
}

if (!this.navigator) { // determine whether this is a node module or inlined via script tag
  module.exports = {
    players: players,
    changeTargetColor: changeTargetColor,
    targetColor: targetColor
  }
}