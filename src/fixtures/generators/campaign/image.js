const faker = require('faker');

module.exports = () => {
  const types = [
    { type: 'image/jpeg', ext: 'jpg' },
    { type: 'image/png', ext: 'png' },
    { type: 'image/webm', ext: 'webm' },
  ];
  const index = faker.random.number({ min: 0, max: types.length - 1 });
  const type = types[index];
  return {
    src: faker.image.imageUrl(null, null, undefined, true, true),
    filePath: faker.fake(`some/path-name/{{random.words}}.${type.ext}`),
    mimeType: type.type,
    fileSize: faker.random.number(2500000),
    width: faker.random.number(1024),
    height: faker.random.number(1024),
    focalPoint: {
      x: faker.random.number({ min: 0, max: 1, precision: 0.1 }),
      y: faker.random.number({ min: 0, max: 1, precision: 0.1 }),
    },
  };
};

