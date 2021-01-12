import {Canvas} from "./canvas";
import CanvasGifEncoder from "@pencil.js/canvas-gif-encoder";

class Point {
  constructor(public x: number,
              public y: number) {
  }
}

export class Pixel {
  constructor(public r: number,
              public g: number,
              public b: number) {
  }
}

class Paint {
  constructor(public p: Point,
              public pixel: Pixel,
              public radius: number,
              public score: number) {
  }
}

export class Solver {
  private thinking: boolean = false;

  private span: HTMLSpanElement;
  private canvas: Canvas;
  private maxRadius: number = 500;

  private aroundPoints: Array<Array<Point>> = [];
  private pixels: Array<Array<Pixel>> = [];

  private currentFrame: number = 0;
  private paintHistory: Array<Paint> = [];

  constructor(canvas: Canvas, origCanvas: Canvas, span: HTMLSpanElement) {
    this.canvas = canvas;
    this.span = span;

    for (let y = 0; y < canvas.height; y++) {
      this.pixels.push([]);
      for (let x = 0; x < canvas.width; x++) {
        this.pixels[y].push(origCanvas.getPixel(x, y));
      }
    }

    this.calcAroundPoints();
  }

  private calcAroundPoints() {
    for (let i = 0; i <= this.maxRadius; i++) {
      this.aroundPoints.push([]);
    }
    for (let dy = -this.maxRadius; dy <= this.maxRadius; dy++) {
      for (let dx = -this.maxRadius; dx <= this.maxRadius; dx++) {
        const dist = Math.floor(Math.sqrt(dx*dx + dy*dy) + 0.9999999);
        if (dist > 500) continue;
        this.aroundPoints[dist].push(new Point(dx, dy));
      }
    }
  }

  private calcPixelDiff(p1: Pixel, p2: Pixel) {
    let diff = 0;
    diff += Math.abs(p1.r - p2.r);
    diff += Math.abs(p1.g - p2.g);
    diff += Math.abs(p1.b - p2.b);
    return diff;
  }

  private inBoard(x: number, y: number) : boolean {
    return x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height;
  }

  proceed() : boolean {
    if (this.thinking) return false;
    this.thinking = true;

    if (this.paintHistory.length > this.currentFrame) {
      this.canvas.putCircle(this.paintHistory[this.currentFrame].p.x,
                            this.paintHistory[this.currentFrame].p.y,
                            this.paintHistory[this.currentFrame].radius,
                            this.paintHistory[this.currentFrame].pixel);
    } else {
      const startTime = Date.now();

      let bestPaint: Paint = new Paint(new Point(-1, -1), new Pixel(0, 0, 0), 0, -1);

      for (let times = 0; times <= 20; times++) {
        let borderDiff: number = 20;
        let x = Math.floor(Math.random() * this.canvas.width);
        let y = Math.floor(Math.random() * this.canvas.height);

        while (this.calcPixelDiff(this.pixels[y][x], this.canvas.getPixel(x, y)) < borderDiff) {
          x = Math.floor(Math.random() * this.canvas.width);
          y = Math.floor(Math.random() * this.canvas.height);
          borderDiff--;
        }

        let maxR: number = 0;
        let maxScore: number = 0;
        let maxArg: Array<number> = [0, 0, 0];

        let base: Array<number> = [0, 0, 0];
        let m: Array<Array<number>> = [];
        let decCnt: number = 0;

        const GETA = 255;

        for (let i = 0; i < 3; i++) {
          m.push([]);
          for (let j = 0; j <= 256 * 3; j++) m[i].push(0);
        }

        for (let radius = 0; radius <= 200; radius++) {
          for (const p of this.aroundPoints[radius]) {
            const tx = x + p.x;
            const ty = y + p.y;
            if (!this.inBoard(tx, ty)) continue;
            const myPixel = this.canvas.getPixel(tx, ty);
            const targetR = 2 * this.pixels[ty][tx].r - myPixel.r;
            const targetG = 2 * this.pixels[ty][tx].g - myPixel.g;
            const targetB = 2 * this.pixels[ty][tx].b - myPixel.b;
            base[0] += Math.abs(this.pixels[ty][tx].r - myPixel.r);
            base[1] += Math.abs(this.pixels[ty][tx].g - myPixel.g);
            base[2] += Math.abs(this.pixels[ty][tx].b - myPixel.b);
            m[0][targetR + GETA]++;
            m[1][targetG + GETA]++;
            m[2][targetB + GETA]++;
          }

          let leftCnt: Array<number> = [0, 0, 0];
          let rightCnt: Array<number> = [0, 0, 0];
          let leftVal: Array<number> = [0, 0, 0];
          let rightVal: Array<number> = [0, 0, 0];
          for (let k = 0; k < 3; k++) {
            for (let key = 0; key <= 256 * 3; key++) {
              const value = m[k][key];
              if (key >= GETA) {
                leftCnt[k] += value;
                leftVal[k] += value * ((key - GETA) + 1) / 2.0;
              } else {
                rightCnt[k] += value;
                rightVal[k] += value * (-(key - GETA)) / 2.0;
              }
            }
          }

          let tmaxScore: Array<number> = [-100000000, -100000000, -100000000];
          let tmaxArg: Array<number> = [0, 0, 0];
          for (let j = 0; j < 256; j++) {
            for (let k = 0; k < 3; k++) {
              leftVal[k] -= leftCnt[k] / 2.0;
              leftCnt[k] -= m[k][j + GETA];

              const score = base[k] - leftVal[k] - rightVal[k];
              if (score > tmaxScore[k]) {
                tmaxScore[k] = score;
                tmaxArg[k] = j;
              }

              rightCnt[k] += m[k][j + GETA];
              rightVal[k] += rightCnt[k] / 2.0;
            }
          }

          let score: number = 0;
          for (let k = 0; k < 3; k++) {
            score += tmaxScore[k];
          }
          if (score > maxScore) {
            maxR = radius;
            maxScore = score;
            for (let k = 0; k < 3; k++) {
              maxArg[k] = tmaxArg[k];
            }
            decCnt = 0;
          } else {
            decCnt++;
            if (decCnt == 5) break;
          }
        }

        if (maxScore > bestPaint.score) {
          bestPaint = new Paint(new Point(x, y), new Pixel(maxArg[0], maxArg[1], maxArg[2]), maxR, maxScore);
        }

        if (Date.now() - startTime >= 500) break;
      }

      this.canvas.putCircle(bestPaint.p.x,
                            bestPaint.p.y,
                            bestPaint.radius,
                            bestPaint.pixel);
      this.paintHistory.push(bestPaint);
    }

    this.currentFrame++;
    this.span.innerText = String(this.currentFrame);

    this.thinking = false;
    return true;
  }

  rewind() {
    if (this.currentFrame === 0)  {
      document.getElementById('button-save-image')?.setAttribute('disabled', '');
      document.getElementById('button-save-gif')?.setAttribute('disabled', '');
      return;
    }
    if (this.thinking) return;
    this.thinking = true;

    this.currentFrame--;
    this.canvas.removeCircle(this.paintHistory[this.currentFrame].p.x,
                             this.paintHistory[this.currentFrame].p.y,
                             this.paintHistory[this.currentFrame].radius,
                             this.paintHistory[this.currentFrame].pixel);
    this.span.innerText = String(this.currentFrame);

    this.thinking = false;
  }

  encodeAsGif() {
    if (this.thinking) return;
    this.thinking = true;

    document.getElementById('file-input')?.setAttribute('disabled', '');
    document.getElementById('button-start')?.setAttribute('disabled', '');
    document.getElementById('button-rewind')?.setAttribute('disabled', '');
    document.getElementById('button-stop')?.setAttribute('disabled', '');
    document.getElementById('button-save-image')?.setAttribute('disabled', '');
    document.getElementById('button-save-gif')?.setAttribute('disabled', '');

    const circleCountElm: HTMLElement = document.getElementById('circle-count') as HTMLElement;
    const progressElm: HTMLElement = document.getElementById('progress') as HTMLElement;
    const progressTextElm: HTMLElement = document.getElementById('progress-text') as HTMLElement;
    circleCountElm.style.display = 'none';
    progressElm.style.display = '';
    progressTextElm.innerText = '0';

    const encoder = new CanvasGifEncoder(this.canvas.width, this.canvas.height);

    this.canvas.init();
    encoder.addFrame(this.canvas.context, 100);

    const that = this;
    function finish() {
      const gif = encoder.end()

      encoder.flush();

      document.getElementById('file-input')?.removeAttribute('disabled');
      document.getElementById('button-start')?.removeAttribute('disabled');
      document.getElementById('button-rewind')?.removeAttribute('disabled');
      document.getElementById('button-stop')?.removeAttribute('disabled');
      document.getElementById('button-save-image')?.removeAttribute('disabled');
      document.getElementById('button-save-gif')?.removeAttribute('disabled');

      circleCountElm.style.display = '';
      progressElm.style.display = 'none';

      that.thinking = false;

      const blob = new Blob([gif], { type: 'image/gif' })
      const a = document.createElement('a') as HTMLAnchorElement;
      a.href = URL.createObjectURL(blob);
      a.target = '_blank';
      a.click();
    }

    const targetFrame: number = this.currentFrame;
    let frame: number = 0;
    let prevPerc: number = 0;
    let thinking2: boolean = false;
    const timeout = setInterval(() => {
      if (thinking2) return;
      thinking2 = true;

      let perc = Math.floor((frame + 1) / (targetFrame) * 100);
      progressTextElm.innerText = String(perc);
      that.canvas.putCircle(that.paintHistory[frame].p.x,
                            that.paintHistory[frame].p.y,
                            that.paintHistory[frame].radius,
                            that.paintHistory[frame].pixel);
      if (perc > prevPerc) {
        prevPerc = perc;
        if (frame === targetFrame - 1) {
          encoder.addFrame(that.canvas.context, 3000);
        } else {
          encoder.addFrame(that.canvas.context, 100);
        }
      }

      frame++;
      if (frame === targetFrame) {
        clearInterval(timeout);
        finish();
      }

      thinking2 = false;
    }, 50);
  }
}