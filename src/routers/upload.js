const { Router } = require('express');
const helmet = require('helmet');
const multer = require('multer');
const Story = require('../models/story');
const ImageRepo = require('../repositories/image');
const asyncRoute = require('../utils/async-route');

const router = Router();
router.use(helmet());

const { IMGIX_URL } = process.env;
const storage = ImageRepo.getMulterStorage();
const upload = multer({ storage });

router.post('/embedded-image', upload.single('file'), asyncRoute(async (req, res) => {
  const { storyId } = req.body;
  const story = await Story.findById(storyId);
  if (!story) throw new Error(`Unable to upload image: no story was found for ID '${storyId}'`);

  const { key, mimetype, size } = req.file;
  const [id, filename] = key.split('/');

  const filePath = `${id}/${encodeURIComponent(filename)}`;
  const src = `${IMGIX_URL}/${filePath}`;
  story.images.push({
    filePath,
    src,
    mimeType: mimetype,
    fileSize: size,
  });
  await story.save();

  const link = `${src}?auto=format&fm=jpg`;
  res.json({ link });
}));

module.exports = router;
