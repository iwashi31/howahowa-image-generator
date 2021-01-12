import {Canvas} from "./canvas";
import {Solver} from "./solver";

let solver: Solver | null = null;
let timeout: NodeJS.Timeout | null = null;

const fileInput: HTMLElement = document.getElementById('file-input') as HTMLElement;
const startButton: HTMLElement = document.getElementById('button-start') as HTMLElement;
const rewindButton: HTMLElement = document.getElementById('button-rewind') as HTMLElement;
const stopButton: HTMLElement = document.getElementById('button-stop') as HTMLElement;
const saveImageButton: HTMLElement = document.getElementById('button-save-image') as HTMLElement;
const saveGifButton: HTMLElement = document.getElementById('button-save-gif') as HTMLElement;
const controlButtons: HTMLElement = document.getElementById('control-buttons') as HTMLElement;

fileInput.addEventListener('change', (e) => {
  const img = document.getElementById('image');
  const reader = new FileReader();
  reader.onloadend = () => {
    const imgReader = new Image();
    imgReader.onload = () => {
      const maxSize = 550;
      const canvas = document.getElementById('canvas') as HTMLCanvasElement;
      const canvas2 = document.getElementById('canvas2') as HTMLCanvasElement;
      let imgHeight = imgReader.height;
      let imgWidth = imgReader.width;
      if (imgWidth >= imgHeight && imgWidth > maxSize) {
        imgHeight *= maxSize / imgWidth;
        imgWidth = maxSize;
      } else if (imgHeight >= imgWidth && imgHeight > maxSize) {
        imgWidth *= maxSize / imgHeight;
        imgHeight = maxSize;
      }
      canvas.height = imgHeight;
      canvas.width = imgWidth;
      canvas.style.display = '';
      canvas2.height = imgHeight;
      canvas2.width = imgWidth;
      canvas2.style.display = 'none';
      canvas.getContext('2d')?.drawImage(imgReader, 0, 0, imgWidth, imgHeight);

      const origCanvasObj = new Canvas(document.getElementById('canvas') as HTMLCanvasElement);
      const canvasObj = new Canvas(document.getElementById('canvas2') as HTMLCanvasElement);
      canvasObj.init();

      const circleCountText = document.getElementById('circle-count-text') as HTMLSpanElement;
      circleCountText.innerText = '0';
      solver = new Solver(canvasObj, origCanvasObj, circleCountText);
    };
    imgReader.src = reader.result as string;
  };
  // @ts-ignore
  reader.readAsDataURL(e.target?.files[0]);

  startButton?.removeAttribute('disabled');
  rewindButton?.setAttribute('disabled', '');
  stopButton?.removeAttribute('disabled');
  saveImageButton.setAttribute('disabled', '');
  saveGifButton.setAttribute('disabled', '');
  controlButtons.style.display = '';
});

startButton.addEventListener('click', (e) => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const canvas2 = document.getElementById('canvas2') as HTMLCanvasElement;
  canvas.style.display = 'none';
  canvas2.style.display = '';

  if (timeout !== null) {
    clearInterval(timeout);
  }
  if (solver !== null) {
    timeout = setInterval(solver.proceed.bind(solver), 50);
  }

  startButton.style.display = 'none';
  stopButton.style.display = '';
  rewindButton.style.display = '';
  rewindButton?.removeAttribute('disabled');
  saveImageButton?.removeAttribute('disabled');
  saveGifButton?.removeAttribute('disabled');
  fileInput.setAttribute('disabled', '');
});

stopButton.addEventListener('click', (e) => {
  if (timeout !== null) {
    clearInterval(timeout);
  }

  stopButton.style.display = 'none';
  startButton.style.display = '';
  rewindButton.style.display = '';
  fileInput.removeAttribute('disabled');
});

rewindButton.addEventListener('click', (e) => {
  if (timeout !== null) {
    clearInterval(timeout);
  }
  if (solver !== null) {
    timeout = setInterval(solver.rewind.bind(solver), 50);
  }

  rewindButton.style.display = 'none';
  stopButton.style.display = '';
  startButton.style.display = '';
  fileInput.setAttribute('disabled', '');
});

function base64ToArrayBuffer(_base64Str) {
  let binaryString = window.atob(_base64Str);
  let binaryLen = binaryString.length;
  let bytes = new Uint8Array(binaryLen);
  for (let i = 0; i < binaryLen; i++) {
    let ascii = binaryString.charCodeAt(i);
    bytes[i] = ascii;
  }
  return bytes;
}

function Base64toBlob(base64) {
  const tmp = base64.split(',');
  const data = atob(tmp[1]);
  const mime = tmp[0].split(':')[1].split(';')[0];
  const buf = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    buf[i] = data.charCodeAt(i);
  }
  const blob = new Blob([buf], { type: mime });
  return blob;
}

saveImageButton.addEventListener('click', (e) => {
  const canvas = document.getElementById('canvas2') as HTMLCanvasElement;
  const base64 = canvas.toDataURL();
  const blob = Base64toBlob(base64);
  const a = document.createElement('a') as HTMLAnchorElement;
  a.href = URL.createObjectURL(blob);
  a.target = '_blank';
  a.click();
});

saveGifButton.addEventListener('click', (e) => {
  solver?.encodeAsGif();
});
