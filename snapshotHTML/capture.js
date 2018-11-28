
(function () {
  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  var width = 320;    // We will scale the photo width to this
  var height = 0;     // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  var streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.
  // var gBrowser = windowUtils.getMostRecentBrowserWindow().getBrowser();

  var video = null;
  var canvas = null;
  var photo = null;
  var startbutton = null;

  function startup() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');
    startbutton = document.getElementById('startbutton');

    //some of the navigator functions were outdated in the skeleton code

    navigator.getMedia = ( navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

    navigator.getMedia(
      {
        video: true,
        audio: false
      },
      function(stream) {
          if (navigator.mediaDevices.getUserMedia) {
              video.srcObject = stream;
          }


        video.play();
      },
      function(err) {
        console.log("An error occured! " + err);
      }
    );

    video.addEventListener('canplay', function(ev){
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth/width);

        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.

        if (isNaN(height)) {
          height = width / (4/3);
        }

        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

    startbutton.addEventListener('click', function(ev){
      takepicture();
      ev.preventDefault();
    }, false);

    //every second take a pictcure
    setInterval(takepicture, 1000);

    clearphoto();
  }

  // Fill the photo with an indication that none has been
  // captured.

  function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
  }

  // Capture a photo by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.

  function takepicture() {
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);

      //take whats onthe canvas then convert it to string data
      var data = canvas.toDataURL('image/png');
        photo.setAttribute('src', data);

        //strips away the object type and leaves only the data
        var strip = data.replace(/^data:image\/\w+;base64,/, "");

        //attempting to keep the snapshot in locAL STorage in browser
        //this did write to localStorage but I could not get the server to read from it
        localStorage.setItem('facepicdata', strip);

        localStorage.setItem('facepicphoto', photo);
        localStorage.setItem('facepiccanvas', canvas);

        var xhr = new XMLHttpRequest();

        //xhr.open('POST', 'http://127.0.0.1:3000', true);
        //xhr.send(strip);
        //try to see if it will work on router
        xhr.open('POST', 'http://127.0.0.1:3000/router/test', true);
        xhr.setRequestHeader('text', strip);
        xhr.send();

        //I want to have data passed from here immeadiately to router
        //first = data;
        //second = data;
         //third = data;

        first = localStorage.getItem('facepicdata');

        //testing statement
        console.log('reads from browser console');
        //console.log('FormData info ', formData);

        //trying to get the data to write somewhere
        //these dont seem to work
        //var fs = require('fs');
        //fs.writeFile('writeit.txt', data);

    } else {
      clearphoto();
    }
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);
})();
