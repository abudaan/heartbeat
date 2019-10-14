"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var close_module_js_1 = __importDefault(require("./close_module.js"));
var addAssetPack = function (ap) { return new Promise(function (resolve) {
    close_module_js_1.default.addAssetPack(ap, function () {
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