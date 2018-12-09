(function() {
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

    var video = null;
    var canvas = null;
    var photo = null;
    var startbutton = null;

    function startup() {
      video = document.getElementById('video');
      canvas = document.getElementById('canvas');
        photo = document.getElementById('photo');
        //start button does nothing currently
        startbutton = document.getElementById('startbutton');

    //some of the navigator functions were outdated in the skeleton code
    //import get media functions
        navigator.getMedia =
           (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);

      navigator.getMedia(
        {
          video: true,
          audio: false
        },
        function(stream) {
          if (navigator.getMedia) {
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

          //get photo element so it can be rewritten by new data
          photo = document.getElementById('photo');

          //take whats on the canvas then convert it to base 64 string data
          var data = canvas.toDataURL('image/png');
          photo.setAttribute('src', data);

          //strips away the object type at the front and leaves only the actual data as a string
          var strip = data.replace(/^data:image\/\w+;base64,/, "");

          //I may have to set the reqheader to multipart/form data
          //Instantiate the objects needed to send form data
          const xhr = new XMLHttpRequest();
          const fd = new FormData();

          //Ready the post request to whatever route the upload will take place at
          ////UPDATE THIS PORT
          xhr.open('POST', 'http://127.0.0.1:3000/upload', true);

          //append base 64 string to formdata
          fd.append('strip', strip);

          //append photo element
          var photo = document.getElementById('photo');
          fd.append('photo', photo);

          //send the request with the form data in the body
          xhr.send(fd);

      }

      else {
        clearphoto();
      }
    }

    // Set up our event listener to run the startup process
    // once loading is complete.
    window.addEventListener('load', startup, false);
  })();
