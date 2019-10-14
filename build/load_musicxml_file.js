"use strict";
// import sequencer from 'heartbeat-sequencer';
Object.defineProperty(exports, "__esModule", { value: true });
// const addAssetPack = (ap: Heartbeat.AssetPack): Promise<void> => new Promise((resolve) => {
//   sequencer.addAssetPack(ap, () => {
//     resolve();
//   });
// })
var loadMusicXMLFile = function (url) {
    return new Promise(function (resolve, reject) {
        fetch(url)
            .then(function (response) { return response.text(); })
            .then(function (str) {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(str, 'application/xml');
            resolve(xmlDoc);
        });
    });
};
exports.loadMusicXMLFile = loadMusicXMLFile;
//# sourceMappingURL=load_musicxml_file.js.map