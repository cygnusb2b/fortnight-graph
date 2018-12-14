const faker = require('faker');

module.exports = () => {
  const types = [
    { type: 'image/jpeg', ext: 'jpg' },
    { type: 'image/gif', ext: 'gif' },
    { type: 'image/png', ext: 'png' },
    { type: 'image/webm', ext: 'webm' },
  ];
  const index = faker.random.number({ min: 0, max: types.length - 1 });
  const type = types[index];
  const filename = faker.fake(`some/path-name/{{random.words}}.${type.ext}`);
  return {
    filename,
    s3: {
      bucket: 'fortnight-materials',
      location: `https://fortnight-materials.s3.amazonaws.com/5b218c012a67f004f78744a0/${filename}`,
    },
    uploadedAt: new Date(),
    mimeType: type.type,
    size: faker.random.number(2500000),
    width: faker.random.number(1024),
    height: faker.random.number(1024),
    focalPoint: {
      x: faker.random.number({ min: 0, max: 1, precision: 0.1 }),
      y: faker.random.number({ min: 0, max: 1, precision: 0.1 }),
    },
  };
};
