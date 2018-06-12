const { Router } = require('express');
const helmet = require('helmet');
const multer = require('multer');
const Story = require('../models/story');
const ImageRepo = require('../repositories/image');
const asyncRoute = require('../utils/async-route');

const router = Router();
router.use(helmet());

const storage = ImageRepo.getMulterStorage();
const upload = multer({ storage });

router.post('/embedded-image', upload.single('file'), asyncRoute(async (req, res) => {
  const { storyId } = req.body;
  const story = await Story.findById(storyId);
  if (!story) throw new Error(`Unable to upload image: no story was found for ID '${storyId}'`);

  const { key, mimetype, size } = req.file;
  const [id, filename] = key.split('/');

  const filePath = `${id}/${encodeURIComponent(filename)}`;
  const image = story.images.create({
    filePath,
    mimeType: mimetype,
    fileSize: size,
  });
  story.images.push(image);
  await story.save();

  const link = `${image.src}?auto=format&fm=jpg`;
  res.json({ link, storyId, imageId: image.id });
}));

module.exports = router;
