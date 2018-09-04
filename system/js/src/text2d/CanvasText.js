var fontHeightCache = {}

class CanvasText {

  constructor () {
    this.textWidth = null;
    this.textHeight = null;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 128;
    this.canvas.height = 128;
    this.ctx = this.canvas.getContext('2d');
  }

  get width () { return this.canvas.width }
  get height () { return this.canvas.height }

  drawText (text, ctxOptions) {

    this.ctx.font = ctxOptions.font
    this.textWidth = Math.ceil(this.ctx.measureText(text).width)
    this.textHeight = getFontHeight(this.ctx.font)

    //this.canvas.width = THREE.Math.nextPowerOfTwo(this.textWidth)
    //this.canvas.height = THREE.Math.nextPowerOfTwo(this.textHeight)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = ctxOptions.fillStyle;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    //this.ctx.

    this.ctx.font = ctxOptions.font
    this.ctx.fillStyle = "#000";
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

    return this.canvas
  }

}

function getFontHeight (fontStyle) {
  var result = fontHeightCache[fontStyle];

  if (!result)
  {
    var body = document.getElementsByTagName('body')[0];
    var dummy = document.createElement('div');

    var dummyText = document.createTextNode('span');
    dummy.appendChild(dummyText);
    dummy.setAttribute('style', 'font:' + fontStyle + ';position:absolute;top:0;left:0');
    body.appendChild(dummy);
    result = dummy.offsetHeight;

    fontHeightCache[fontStyle] = result;
    body.removeChild(dummy);
  }

  return result;
}

module.exports = CanvasText