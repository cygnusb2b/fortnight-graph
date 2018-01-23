const AWS = require('aws-sdk');
const Promise = require('bluebird');
const uuidv4 = require('uuid/v4');

const S3 = new AWS.S3();

module.exports = {
  /**
   *
   */
  signUpload(filename) {
    const key = `${uuidv4()}/${filename}`;
    const expires = 120;
    const params = {
      Bucket: 'fortnight-materials',
      Key: key,
      ACL: 'public-read',
      Expires: expires,
    };
    return new Promise((resolve, reject) => {
      S3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve({ url, key, expires });
        }
      });
    });
  },
};
