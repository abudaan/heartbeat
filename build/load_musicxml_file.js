"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assetpack_js_1 = require("./assetpack.js");
var addAssetPack = function (ap) { return new Promise(function (resolve) {
    assetpack_js_1.addAssetPack(ap, function () {
        resolve();
    });
}); };
exports.addAssetPack = addAssetPack;
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