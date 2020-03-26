/** @module A simple module to house common functionality and provide a module shim
 * for libraries that export a function directly that cannot be mocked by default.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const download = (url, destination, fileName) => {
  const parts = url.split('/');
  const file = fileName || parts[parts.length - 1];
  const fullDestination = path.join(destination, file);
  const writer = fs.createWriteStream(fullDestination);

  return axios.get(url, { responseType: 'stream' })
    .then((resp) => {
      resp.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('close', resolve);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    });
};

module.exports = {
  download,
};
