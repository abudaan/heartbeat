## 0.0.17
> December 11, 2019

Fixed several issues related to routing tracks to a MIDI outport:

- When the song stops or ends all notes will stop
- `track.setVolume()` now works 
- When `track.audioLatency` is set, the "stop all notes" and "reset all controllers" events are sent with a delay as long as the set audio latency &rarr; no endless notes anymore

Fixed npm package issue &rarr; the esnext wrapper is now compiled to es5.

