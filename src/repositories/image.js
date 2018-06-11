const AWS = require('aws-sdk');
const Promise = require('bluebird');
const uuidv4 = require('uuid/v4');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({
  signatureVersion: 'v4',
});

const S3_BUCKECT = 'fortnight-materials';

let multerStorage;

module.exports = {
  /**
   *
   */
  async signUpload(filename, type) {
    if (!filename) throw new Error('Unable to sign upload: no filename provided.');
    if (!this.isAcceptable(type)) throw new Error('Unable to sign upload: invalid file type.');

    const key = this.generateFileKey(filename);
    const expires = 120;
    const params = {
      Bucket: S3_BUCKECT,
      Key: key,
      ACL: 'public-read',
      Expires: expires,
      ContentType: type,
    };
    return new Promise((resolve, reject) => {
      s3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve({ url, key: encodeURIComponent(key), expires });
        }
      });
    });
  },

  /**
   * Determines if the provided MIME type is acceptable.
   *
   * @param {string} mimeType
   * @return {boolean}
   */
  isAcceptable(mimeType) {
    return this.getAcceptableTypes().includes(mimeType);
  },

  /**
   * Gets the allowed/acceptable image MIME types.
   */
  getAcceptableTypes() {
    return ['image/png', 'image/jpeg', 'image/webm'];
  },

  /**
   * Generates the file key for the provided file name.
   *
   * @param {string} filename
   * @return {string}
   */
  generateFileKey(filename) {
    const id = uuidv4();
    return `${id}/${filename}`;
  },

  getMulterStorage() {
    if (!multerStorage) {
      multerStorage = multerS3({
        s3,
        bucket: S3_BUCKECT,
        key: (req, file, cb) => {
          const { originalname, mimetype } = file;
          if (!this.isAcceptable(mimetype)) {
            cb(new Error(`The provided MIME type of '${mimetype}' is not allowed.`));
          } else {
            cb(null, this.generateFileKey(originalname));
          }
        },
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
      });
    }
    return multerStorage;
  },
};
