heartbeat
=========


Heartbeat is a set of tools for easy MIDI handling in your browser. The tools can be used separately but they also work very well together. Read on or skip directly to the [key features](#key-features).

With heartbeat you can import existing MIDI files or create new files from scratch. There is a large number of tools available for editing and manipulating the MIDI data and you can save the result to a local MIDI file.

MIDI files can be played back via the built-in simple sinewave synth, or via the built-in sample player. The sample player supports sustained instruments like organs and strings, and you can use instruments with multiple velocity layers.

In browsers that support the WebMIDI API you can also record MIDI directly into your browser and send MIDI events via a MIDI output to a local softsynth or a local hardware device.

Heartbeat has no GUI. It is intended to be used as an engine behind your application. Heartbeat is set up very flexible so you can make any kind of application on top of it; a game, an online DAW, artistic sites, music science experiments and so on.

The tools are organized around the concept of a song like Ardour, Cubase, Logic and so on. So you have songs that contain tracks that contain parts that contain MIDI or Audio events. But you can also just create and play events without the whole hierarchical structure of a song.

Each track has individual panning and volume controllers. Each song has its own master volume. Channel effects like reverb can be added per track, and to the master output of a song.

You can create instruments for the sample player very easily yourself. The instrument format is very similar to the .sfz format and in the tools folder you'll find a tool that converts .sfz files to heartbeat instruments.

Heartbeat instruments support the controller events sustain pedal, volume and panning. You can set the release duration and the type of release envelope and you can set key scaling for panning (stereo spread) and for release duration.

There are a couple of instruments available that show you what is possible. For instance the City Piano is an example of an instrument with multiple velocity layers and the organ an example of a sustained instrument.

Documentation can be found on [heartbeatjs.org](http://heartbeatjs.org) but it is utterly incomplete. The examples expose some of the features and their working, but that still leaves plenty of features unexplained. I am working hard to get the documentation complete.

Meanwhile if you have questions about heartbeat, drop me a line or create an [issue](https://github.com/abudaan/heartbeat/issues).


<a name="key-features"></a>
*key features*


#MIDI:
- create midi file from scratch
- import existing midi files
- save midi data to file (SMF 1.0)
- record midi (only in browsers that support the WebMIDI API)
- quantize and fixed length functions
- quantize undo history
- you can set the PPQ value of a file
- support for tempo and time signature changes
- multiple songs to be loaded and played back at the same time
- midi data can be shared or moved across songs, tracks and parts very easily


#Instruments:
- support multiple velocity layers
- support control change events for sustain pedal, volume and panning
- sustained instruments (like organ, stings, pads)
- keyscaling for release and panning
- configurable release duration and envelope type
- support for .sfz format (upto a certain level)
- instrument samples can be transposed at runtime (experimental)


#Audio
- volume and panning controller per track
- volume controller per song and one master volume output with compression
- channel effects per track: reverb, panning, autopan and more to come


