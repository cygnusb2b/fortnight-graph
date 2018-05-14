const AWS = require('aws-sdk');
const Promise = require('bluebird');
const uuidv4 = require('uuid/v4');

const S3 = new AWS.S3({
  signatureVersion: 'v4',
});

module.exports = {
  /**
   *
   */
  signUpload(filename, type) {
    if (!filename) return Promise.reject(new Error('Unable to sign upload: no filename provided.'));

    const acceptable = ['image/png', 'image/jpeg', 'image/webm'];
    if (!acceptable.includes(type)) return Promise.reject(new Error('Unable to sign upload: invalid file type.'));

    const id = uuidv4();
    const expires = 120;
    const params = {
      Bucket: 'fortnight-materials',
      Key: `${id}/${filename}`,
      ACL: 'public-read',
      Expires: expires,
      ContentType: type,
    };
    return new Promise((resolve, reject) => {
      S3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve({ url, key: `${id}/${encodeURIComponent(filename)}`, expires });
        }
      });
    });
  },
};
