/// <reference types="webmidi" />

export as namespace sequencer;

export function createSong(config: any): Song
export function createTrack(name: string): Track
export function createPart(name?: string): Part
export function createKeyEditor(song: Song, config: any): KeyEditor
export function getMidiFiles(): MIDIFileJSON[]
export function getInstruments(): Instrument[]
export function ready(): boolean
export var browser: string
export var midiInputs: WebMidi.MIDIInput[]
export var midiOutputs: WebMidi.MIDIOutput[]

export as namespace Heartbeat;

export interface SongPosition {
  bar?: number
  beat?: number
  sixteenth?: number
  tick?: number
  ticks: number
  timestamp: number
  barsAsString: string
  activeColumn: number
}

export type Listener = {
  [key: string]: any
}

export interface Song {
  ppq: number
  nominator: number
  denominator: number
  beat: number
  sixteenth: number
  tick: number
  ticks: number
  activeNotes: Array<MIDIEvent>
  id: string
  name: string
  loop: boolean
  playing: boolean
  bpm: number
  durationTicks: number
  millisPerTick: number
  parts: Array<Part>
  tracks: Array<Track>
  listeners: Listener
  loopEndPosition: SongPosition
  bars: number // number of bars in Song
  bar: number // current bar position
  barsAsString: string // current position in bars
  events: Array<MIDIEvent>
  timeEvents: Array<MIDIEvent>
  notes: Array<MIDINote>
  useMetronome: boolean
  play: () => void
  pause: () => void
  stop: () => void
  update: (updateTimeEvents?: boolean) => void
  setTempo: (bpm: number, update?: boolean) => void
  addEventListener: (event: string, typeOrCallback: any, callback?: (arg?: any) => void) => void
  addMidiEventListener: (event: string, callback: (arg?: any) => void) => void
  removeEventListener: (type: string) => void
  setLoop: (loop?: boolean) => void
  setLeftLocator: (type: string, bar: number, beat?: number, sixteenth?: number, tick?: number) => void
  setRightLocator: (type: string, bar: number, beat?: number, sixteenth?: number, tick?: number) => void
  addEvents: (events: Array<MIDIEvent>) => void
  addTimeEvents: (events: Array<MIDIEvent>) => void
  removeTimeEvents: () => void
  setTrackSolo: (t: Track, f: boolean) => void
  getPosition: () => SongPosition
  addTrack: (t: Track) => void
  paused: boolean
  setPlayhead: (type: string, value: number) => void
}

export interface MIDIEvent {
  id: string
  bar: number
  type: number
  data1: number
  data2: number
  ticks: number
  command: number
  noteName: string
  noteNumber: number
  velocity: number
  midiNote: MIDINote
  muted: boolean
  song: null | Heartbeat.Song
  track: null | Track
  part: null | Part
  clone: () => this
  transpose: (semi: number) => void
}

export interface MIDINote extends MIDIEvent {
  trackId: string
  track: Track
  number: number
  noteOn: MIDIEvent
  noteOff: MIDIEvent
  mute: (flag: boolean) => void
}

export interface Part {
  id: string
  name: string
  events: Array<MIDIEvent>
  needsUpdate: boolean
  eventsById: { [id: string]: MIDIEvent }
  addEvents: (events: Array<MIDIEvent>) => void
  removeEvents: (events: Array<MIDIEvent>, part?: Part) => void
  transposeAllEvents: (semi: number) => void
  bbox: {
    x: number
    y: number
    width: number
    height: number
  }
}

export type Track = {
  id: string
  name: string
  parts: Array<Part>
  events: Array<MIDIEvent>
  needsUpdate: boolean
  partsById: { [id: string]: Part }
  audioLatency: number
  monitor: boolean
  mute: boolean
  addPart: (part: Part) => void
  addPartAt: (part: Part, type: [string, number]) => void
  removeEvents: (events: Array<MIDIEvent>) => void
  removeAllEvents: () => void
  processMidiEvent: (event: MIDIEvent | Array<MIDIEvent>) => void
  setMidiInput: (id: string, flag: boolean) => void
  setMidiOutput: (id: string, flag: boolean) => void
  setInstrument: (id: string) => void
  removePart: (part: Part) => void
  update: () => void
};

export type InstrumentMapping = {
  [id: string]: {
    [id: string]: string
  }
}

export interface Instrument {
  name: string
  mapping: InstrumentMapping
}

export interface AssetPack {
  instruments: Array<Instrument>
  midifiles: Array<string>
}

export interface MIDIPortsObject {
  [id: string]: WebMidi.MIDIPort
}

export interface MIDIFileJSON {
  id: string
  url: string
  name: string
  ppq: number
  bpm: number
  nominator: number
  denominator: number
  tracks: Array<Track>
  timeEvents: Array<MIDIEvent>
}

export type MIDIFileDataTrack = {
  name: string, events: Array<MIDIEvent>
}

export type MIDIFileData = {
  ppq: number
  bpm: number
  nominator: number
  denominator: number,
  name: string,
  timeEvents: Array<MIDIEvent>,
  tracks: Array<MIDIFileDataTrack>,
}


// config file that gets loaded when the app starts
export interface Config {
  midiFiles: Array<string>
  assetPacks: Array<string>
  instruments: Array<string>
  tempoMin: number
  tempoMax: number
  granularity: number
  granularityOptions: Array<number>
}

export interface SongInfo {
  tracks: Array<any>
  bars: number
  ppq: number
  nominator: number
  denominator: number
}

// export type MIDIPort = {
//   id: string
//   connection: string
//   manufacturer: string
//   name: string
//   state: string
//   type: string
//   verions: string
//   onstatechange: () => void
//   addEventListener: (type: string, callback: (m: WebMidi.MIDIMessageEvent) => void) => void
//   removeEventListener: (type: string, callback: (m: WebMidi.MIDIMessageEvent) => void) => void
// }

export type LineData = {
  x: number
  y: number
  bar: number
  beat: number
  sixteenth: number
  type: string
}

export type KeyEditor = {
  xToTicks: (x: number) => number
  ticksToX: (ticks: number) => number
  yToPitch: (y: number) => Heartbeat.MIDINote
  pitchToY: (noteNumber: number) => number
  setPlayheadToX: (x: number) => void
  getPlayheadX: () => number
  setBarsPerPage: (bbp: number) => void
  startMovePart: (part: Part, x: number, y: number) => void
  stopMovePart: () => void
  movePart: (x: number, y: number, updateSong?: boolean) => void
  setViewport: (width: number, height: number) => void
  setSnapX: (snap: number) => void
  verticalLine: {
    next: (type: string) => LineData,
    hasNext: (type: string) => LineData,
    reset: () => void,
  }
  horizonalLine: {
    next: (type: string) => LineData
    hasNext: (type: string) => LineData
    reset: () => void
  }
  selectedPart: Part
  song: Song
  getSnapshot: () => SnapShot
}

export type SnapShot = {
  parts: {
    changed: Part[]
  }
}

