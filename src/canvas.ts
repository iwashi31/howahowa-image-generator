import {Pixel} from "./solver";

export class Canvas {
  public width: number;
  public height: number;

  private canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  private pixels: Array<Array<Pixel>> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D;

    this.width = canvas.width;
    this.height = canvas.height;

    for (let y = 0; y < canvas.height; y++) {
      this.pixels.push([]);
      for (let x = 0; x < canvas.width; x++) {
        this.pixels[y].push(new Pixel(0, 0, 0));
      }
    }
  }

  private paintPixel(x: number, y: number, r: number, g: number, b: number) {
    this.pixels[y][x].r = (r + this.pixels[y][x].r) / 2;
    this.pixels[y][x].g = (g + this.pixels[y][x].g) / 2;
    this.pixels[y][x].b = (b + this.pixels[y][x].b) / 2;

    const pixel = this.context.createImageData(1, 1);
    pixel.data[0] = Math.floor(this.pixels[y][x].r);
    pixel.data[1] = Math.floor(this.pixels[y][x].g);
    pixel.data[2] = Math.floor(this.pixels[y][x].b);
    pixel.data[3] = 255;
    this.context.putImageData(pixel, x, y);
  }

  private unpaintPixel(x: number, y: number, r: number, g: number, b: number) {
    this.pixels[y][x].r = 2 * this.pixels[y][x].r - r;
    this.pixels[y][x].g = 2 * this.pixels[y][x].g - g;
    this.pixels[y][x].b = 2 * this.pixels[y][x].b - b;

    const pixel = this.context.createImageData(1, 1);
    pixel.data[0] = Math.floor(this.pixels[y][x].r);
    pixel.data[1] = Math.floor(this.pixels[y][x].g);
    pixel.data[2] = Math.floor(this.pixels[y][x].b);
    pixel.data[3] = 255;
    this.context.putImageData(pixel, x, y);
  }

  init() {
    this.context.fillStyle = "rgb(0, 0, 0)";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        this.pixels[y][x].r = 0;
        this.pixels[y][x].g = 0;
        this.pixels[y][x].b = 0;
      }
    }
  }

  getPixel(x: number, y: number) : Pixel {
    const img = this.context.getImageData(x, y, 1, 1);
    return new Pixel(img.data[0], img.data[1], img.data[2]);
  }

  putCircle(x: number, y: number, radius: number, pixel: Pixel) {
    for (let dy = -radius; dy <= radius; dy++) {
      const ty = y + dy;
      if (ty < 0 || ty >= this.canvas.height) continue;
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = x + dx;
        if (tx < 0 || tx >= this.canvas.width) continue;
        if (dx*dx + dy*dy > radius*radius) continue;
        this.paintPixel(tx, ty, pixel.r, pixel.g, pixel.b);
      }
    }
  }

  removeCircle(x: number, y: number, radius: number, pixel: Pixel) {
    for (let dy = -radius; dy <= radius; dy++) {
      const ty = y + dy;
      if (ty < 0 || ty >= this.canvas.height) continue;
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = x + dx;
        if (tx < 0 || tx >= this.canvas.width) continue;
        if (dx*dx + dy*dy > radius*radius) continue;
        this.unpaintPixel(tx, ty, pixel.r, pixel.g, pixel.b);
      }
    }
  }
}