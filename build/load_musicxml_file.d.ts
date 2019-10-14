declare const addAssetPack: (ap: Heartbeat.AssetPack) => Promise<void>;
declare const loadMusicXMLFile: (url: string) => Promise<XMLDocument>;
export { loadMusicXMLFile, addAssetPack, };
