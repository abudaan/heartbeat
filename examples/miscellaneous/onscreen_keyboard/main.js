var sequencer = window.sequencer

document.addEventListener('DOMContentLoaded', function(){

  // load a midi file
  sequencer.addMidiFile({url: 'http://abumarkub.net/heartbeatjs/assets/minute_waltz.mid'})
  // load an asset pack, this pack contains a piano
  sequencer.addAssetPack({url: 'http://abumarkub.net/heartbeatjs/assets/asset_pack_basic.json'}, init)

  function init(){

    var midiFile = sequencer.getMidiFile('minute_waltz')
    var song = sequencer.createSong(midiFile)
    var piano = sequencer.createInstrument('piano')

    // set all tracks of the song to use 'piano'
    song.tracks.forEach(function(track){
      track.setInstrument(piano)
    })

    // transport controls
    var btnPlay = document.getElementById('play')
    var btnPause = document.getElementById('pause')
    var btnStop = document.getElementById('stop')

    btnPlay.disabled = false
    btnPause.disabled = false
    btnStop.disabled = false

    btnPlay.addEventListener('click', function(){
      song.play()
    })

    btnPause.addEventListener('click', function(){
      song.pause()
    })

    btnStop.addEventListener('click', function(){
      song.stop()
    })


    // very rudimental on-screen keyboard
    let keys = {}
    let keyNames = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
    keyNames.forEach(function(key){

      var btnKey = document.getElementById(key)
      btnKey.disabled = false
      keys[key] = btnKey

      btnKey.addEventListener('mousedown', startNote, false)
      btnKey.addEventListener('mouseup', stopNote, false)
      btnKey.addEventListener('mouseout', stopNote, false)
    })


    // both the on-screen keyboard and the connected external MIDI devices play back over the first track of the song (could be any track)
    var track = song.tracks[0]
    track.monitor = true
    track.setMidiInput('all')
    track.setInstrument('piano')

    function startNote(){
      var noteNumber = sequencer.getNoteNumber(this.id)
      track.processMidiEvent(sequencer.createMidiEvent(0, sequencer.NOTE_ON, noteNumber, 100))
    }

    function stopNote(){
      var noteNumber = sequencer.getNoteNumber(this.id)
      track.processMidiEvent(sequencer.createMidiEvent(0, sequencer.NOTE_OFF, noteNumber))
    }

    function updateOnScreenKeyboard(event){
      var btn = keys[event.note.fullName]
      // check if this key exists on the on-screen keyboard because not all keys exist on our rudimentary keyboard
      if(btn){
        btn.className = event.type === 144 ? 'key-down' : 'key-up'
      }
    }

    // add listeners for all noteon and noteoff events when an external MIDI keyboard or the on-screen keyboard is played
    track.addMidiEventListener(sequencer.NOTE_ON, updateOnScreenKeyboard)
    track.addMidiEventListener(sequencer.NOTE_OFF, updateOnScreenKeyboard)

    // add listeners for all noteon and noteoff events during playback of the song
    song.addEventListener('event', 'type = 144', updateOnScreenKeyboard)
    song.addEventListener('event', 'type = 128', updateOnScreenKeyboard)


    // set all keys of the on-screen keyboard to the up state when the song stops or pauses
    song.addEventListener('stop', function(){
      for(var key in keys){
        if(keys.hasOwnProperty(key)){
          key.className = 'key-up'
        }
      }
    })

    song.addEventListener('pause', function(){
      for(var key in keys){
        if(keys.hasOwnProperty(key)){
          key.className = 'key-up'
        }
      }
    })
  }
})
