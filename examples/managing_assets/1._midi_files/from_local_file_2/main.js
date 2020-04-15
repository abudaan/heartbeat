window.onload = function () {
  "use strict";

  var // satisfy jslint
    sequencer = window.sequencer,
    console = window.console,
    btnStop = document.getElementById("stop"),
    btnStart = document.getElementById("start"),
    btnLoad = document.getElementById("load"),
    divDrop = document.getElementById("drop-file"),
    inputFile = document.getElementById("input-file"),
    divLoaded = document.getElementById("loaded-midifile"),
    spanMessage = document.getElementById("instruction"),
    outputs = document.getElementById("outputs"),
    reader = new FileReader(),
    fileName,
    initialized,
    song;

  sequencer.ready(function init() {
    // drag and drop
    divDrop.addEventListener(
      "dragover",
      function (e) {
        e.preventDefault();
        divDrop.className = "hover";
      },
      false
    );

    divDrop.addEventListener(
      "dragenter",
      function (e) {
        e.preventDefault();
        divDrop.className = "hover";
      },
      false
    );

    divDrop.addEventListener(
      "dragleave",
      function (e) {
        e.preventDefault();
        divDrop.className = "prompt";
      },
      false
    );

    divDrop.addEventListener(
      "drop",
      function (e) {
        e.preventDefault();
        loadFiles(e.dataTransfer.files);
      },
      false
    );

    // file menu
    inputFile.addEventListener(
      "change",
      function (e) {
        e.preventDefault();
        loadFiles(inputFile.files);
      },
      false
    );

    btnLoad.addEventListener(
      "click",
      function () {
        inputFile.click();
      },
      false
    );

    reader.addEventListener("loadend", createSong, false);

    reader.addEventListener(
      "error",
      function (e) {
        console.log(e);
      },
      false
    );

    btnStart.addEventListener("click", function () {
      song.play();
    });

    btnStop.addEventListener("click", function () {
      song.stop();
    });
  });

  function loadFiles(fileList) {
    var file;

    btnStart.disabled = true;
    btnStop.disabled = true;

    if (fileList.length === 0) {
      return;
    }

    file = fileList[0];
    fileName = file.name;

    if (file.type !== "audio/midi") {
      spanMessage.textContent = fileName + " this is not a MIDI file";
      return;
    }

    btnLoad.className = "hidden";
    divDrop.className = "processing";
    spanMessage.textContent = "processing " + fileName;
    divLoaded.textContent = "";

    reader.readAsArrayBuffer(file);
  }

  function createSong() {
    // createMidiFile returns a Promise
    sequencer.createMidiFile({ arraybuffer: reader.result }).then(
      function onFullfilled(midifile) {
        if (song) {
          sequencer.deleteSong(song);
        }
        song = sequencer.createSong(midifile);
        if (initialized !== true) {
          initialized = true;
          outputs.innerHTML =
            "<div>Route the events of the tracks of the song to one (or more) midi output(s) by selecting the checkbox:<div>";

          // get all midi outputs from this song
          song.getMidiOutputs(function (port) {
            const checkbox = document.createElement("input");
            checkbox.setAttribute("type", "checkbox");
            checkbox.setAttribute("value", port.id);
            checkbox.id = port.id;

            const label = document.createElement("label");
            label.setAttribute("for", port.id);
            outputs.appendChild(label);
            label.appendChild(checkbox);
            label.innerHTML += port.name;

            document.getElementById(checkbox.id).addEventListener(
              "click",
              function (e) {
                song.tracks.forEach(function (track) {
                  track.setMidiOutput(e.target.value, e.target.checked);
                  // track.setVolume(0);
                  track.audioLatency = 100;
                });
              },
              false
            );
          });
        }

        btnLoad.className = "";
        divDrop.className = "prompt";
        divLoaded.textContent = "currently loaded: " + fileName;
        spanMessage.textContent = "Drop your MIDI file here";

        btnStart.disabled = false;
        btnStop.disabled = false;
        //console.log(sequencer.storage);
      },

      function onRejected(e) {
        console.log(e);
        btnLoad.className = "";
        divDrop.className = "prompt";
        spanMessage.textContent = "Drop your MIDI file here";
      }
    );
  }
};
