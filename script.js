// script.js

const img = new Image(); // used to load image from <input> and draw to canvas

var voice_avail = false;
var voice_list = [];
var canvas = document.getElementById('user-image');

// Fires whenever the img object loads a new image (such as with img.src =)
img.addEventListener('load', loadImg
  // Some helpful tips:
  // - Fill the whole Canvas with black first to add borders on non-square images, then draw on top
  // - Clear the form when a new image is selected
  // - If you draw the image to canvas here, it will update as soon as a new image is selected
);

// Handle image input
let image_input = document.getElementById('image-input');
image_input.addEventListener('change', (event) => {
  img.src = URL.createObjectURL(image_input.files[0]);
});

// Handle Generate button
// So bad! Why leaving the id unset? >_>
let generate = document.querySelector("#generate-meme button[type='submit']");
generate.onclick = function(e) {
  e.preventDefault();
  let inputs = document.getElementById("generate-meme").elements,
      text_top = inputs["text-top"].value,
      text_bot = inputs["text-bottom"].value;
    
  if (canvas.getContext) {
    let ctx = canvas.getContext('2d');
    if (img.src) {
      loadImg();
    }
    else {
      ctx.fillStyle = 'rgb(0,0,0)';
      ctx.fillRect(0,0, canvas.width, canvas.height);
    }
    drawText(text_top, text_bot, ctx, 36, "serif");
  }
  else {
    console.log("Canvas unsupported");
  }
}

// Handle Clear button
document.querySelector("#button-group button[type='reset']").addEventListener('click', () => {
  if (canvas.getContext) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }
  document.querySelector("#button-group button[type='reset']").setAttribute('disabled', true);
  document.querySelector("#button-group button[type='button']").setAttribute('disabled', true);
  document.getElementById("generate-meme").reset();
  window.speechSynthesis.cancel();
})

document.getElementById("generate-meme").addEventListener('change', () => {
  document.querySelector("#button-group button[type='reset']").removeAttribute("disabled");
})

// Voice options
if (window.speechSynthesis.getVoices) {
  // https://stackoverflow.com/questions/49506716/speechsynthesis-getvoices-returns-empty-array-on-windows
  setTimeout(() => {
    let voices = window.speechSynthesis.getVoices();
    voice_list = voices;
    if (voices.length > 0) {
      let voice_list = document.getElementById('voice-selection');
      voice_list.removeAttribute("disabled");
      voice_list.removeChild(document.querySelector("#voice-selection option"));
      for (let i = 0; i < voices.length; i++) {
        let option = document.createElement('option');
        option.textContent = voices[i].name + ' (' + voices[i].lang + ')';

        if(voices[i].default) {
          option.textContent += ' -- DEFAULT';
        }

        option.setAttribute('data-lang', voices[i].lang);
        option.setAttribute('data-name', voices[i].name);
        voice_list.appendChild(option);
      }
      voice_avail = true;
    }
  }, 1000);
}

// Handle Read Text button
document.getElementById("text-top").addEventListener('change', () => {
  if (voice_avail)
    document.querySelector("#button-group button[type='button']").removeAttribute("disabled");
})

document.getElementById("text-bottom").addEventListener('change', () => {
  if (voice_avail)
    document.querySelector("#button-group button[type='button']").removeAttribute("disabled");
})

document.querySelector("#button-group button[type='button']").addEventListener('click', (e) => {
  let utterance = new SpeechSynthesisUtterance(document.getElementById("text-top").value + "," + document.getElementById("text-bottom").value);
  let voice = document.getElementById('voice-selection').options[document.getElementById('voice-selection').selectedIndex].getAttribute("data-name");
  for(var i = 0; i < voice_list.length ; i++) {

    if(voice_list[i].name === voice) {
      utterance.voice = voice_list[i];
    }
  }
  utterance.volume = document.querySelector("#volume-group input").value / 100;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
})

// Handle Speaker icon
document.querySelector("#volume-group input").addEventListener('change', (e) => {
  document.querySelector("#volume-group img").setAttribute("src", "icons/volume-level-" + Math.ceil(e.target.value / 34) + ".svg");
})

/**
 * Takes in the dimensions of the canvas and the new image, then calculates the new
 * dimensions of the image so that it fits perfectly into the Canvas and maintains aspect ratio
 * @param {number} canvasWidth Width of the canvas element to insert image into
 * @param {number} canvasHeight Height of the canvas element to insert image into
 * @param {number} imageWidth Width of the new user submitted image
 * @param {number} imageHeight Height of the new user submitted image
 * @returns {Object} An object containing four properties: The newly calculated width and height,
 * and also the starting X and starting Y coordinate to be used when you draw the new image to the
 * Canvas. These coordinates align with the top left of the image.
 */
function getDimmensions(canvasWidth, canvasHeight, imageWidth, imageHeight) {
  let aspectRatio, height, width, startX, startY;

  // Get the aspect ratio, used so the picture always fits inside the canvas
  aspectRatio = imageWidth / imageHeight;

  // If the apsect ratio is less than 1 it's a verical image
  if (aspectRatio < 1) {
    // Height is the max possible given the canvas
    height = canvasHeight;
    // Width is then proportional given the height and aspect ratio
    width = canvasHeight * aspectRatio;
    // Start the Y at the top since it's max height, but center the width
    startY = 0;
    startX = (canvasWidth - width) / 2;
    // This is for horizontal images now
  } else {
    // Width is the maximum width possible given the canvas
    width = canvasWidth;
    // Height is then proportional given the width and aspect ratio
    height = canvasWidth / aspectRatio;
    // Start the X at the very left since it's max width, but center the height
    startX = 0;
    startY = (canvasHeight - height) / 2;
  }

  return { 'width': width, 'height': height, 'startX': startX, 'startY': startY }
}

function drawText(top, bottom, ctx, size, font) {
  ctx.font = size + "px " + font;
  ctx.lineWidth = 6;
  ctx.strokeStype = "black";
  ctx.fillStyle = "white";

  if (top) {
    top = top.split(" ");
    let buffer = top[0];
    let global_y_offset = 0;

    function flush() {
      let text_dim = ctx.measureText(buffer);
      let text_height = text_dim.actualBoundingBoxAscent + text_dim.actualBoundingBoxDescent;
      let y_offset = text_height;
      if (global_y_offset == 0) {
        y_offset = text_height*1.5;
      }
      else {
        y_offset = text_height*1.5 + global_y_offset;
      }
      ctx.strokeText(buffer, (canvas.width - text_dim.width) / 2, y_offset);
      ctx.fillText(buffer, (canvas.width - text_dim.width) / 2, y_offset);
      buffer = "";
      global_y_offset = y_offset;
    }

    if (top.length == 1) {
      flush();
    }

    for (let i = 1; i < top.length; i++) {
      if (ctx.measureText(buffer + top[i]).width < canvas.width * 0.95) {
        buffer += " " + top[i];
        if (i == top.length - 1) {
          // The last word reached and buffer not overflowed
          flush();
        }
      }
      else {
          if (i == top.length - 1) {
            // The last word reached and buffer not overflowed
            // Flush twice
            flush();
            buffer = top[top.length - 1];
            flush();
          }
          else {
            flush();
            buffer = top[i];
          }
      }
    }
  }
  
  if (bottom) {
    bottom = bottom.split(" ");
    let buffer = bottom[bottom.length - 1];
    let global_y_offset = 0;
    
    function flush() {
      let text_dim = ctx.measureText(buffer);
      let text_height = text_dim.actualBoundingBoxAscent + text_dim.actualBoundingBoxDescent;
      let y_offset = text_height;
      if (global_y_offset == 0) {
        y_offset = canvas.height - (text_height*0.5);
      }
      else {
        y_offset = global_y_offset - (text_height*1.5);
      }
      ctx.strokeText(buffer, (canvas.width - text_dim.width) / 2, y_offset);
      ctx.fillText(buffer, (canvas.width - text_dim.width) / 2, y_offset);
      buffer = "";
      global_y_offset = y_offset;
    }

    if (bottom.length == 1) {
      flush();
    }

    for (let i = bottom.length - 2; i > -1; i--) {
      if (ctx.measureText(buffer + bottom[i]).width < canvas.width * 0.95) {
        buffer = bottom[i] + " " + buffer;
        if (i == 0) {
          // The last word reached and buffer not overflowed
          flush();
        }
      }
      else {
        if (i == 0) {
          // The last word reached and buffer overflowed
          // Need to flush twice
          flush();
          buffer = bottom[0];
          flush();
        }
        else {
          flush();
          buffer = bottom[i];
        }
      }
    }
  }
}

function loadImg() {
  if (canvas.getContext) {
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(0,0, canvas.width, canvas.height);

    let img_dim = getDimmensions(canvas.width, canvas.height, img.width, img.height);
    ctx.drawImage(img, img_dim.startX, img_dim.startY, img_dim.width, img_dim.height);
  }
  else {
    console.log("Canvas unsupported!");
  }
}