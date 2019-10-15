import { addAssetPack as seq_addAssetPack } from './assetpack.js';

const addAssetPack = (ap: Heartbeat.AssetPack): Promise<void> => new Promise((resolve) => {
  seq_addAssetPack(ap, () => {
    resolve();
  });
})

const loadMusicXMLFile = (url: string): Promise<XMLDocument> => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.text())
      .then(str => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(str, 'application/xml');
        resolve(xmlDoc);
      });
  });
}

export {
  loadMusicXMLFile,
  addAssetPack,
};