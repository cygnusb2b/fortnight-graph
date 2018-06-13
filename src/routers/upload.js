const { Router } = require('express');
const helmet = require('helmet');
const multer = require('multer');
const Story = require('../models/story');
const DatabaseStorage = require('../multer/database-storage');
const asyncRoute = require('../utils/async-route');

const router = Router();
router.use(helmet());

const upload = multer({ storage: new DatabaseStorage() });

router.post('/image', upload.single('file'), (req, res) => {
  const { record } = req.file;
  res.json({ id: record.id, link: record.src });
});

router.post('/story-image', upload.single('file'), asyncRoute(async (req, res) => {
  const { record } = req.file;
  const { storyId } = req.body;

  const story = await Story.findById(storyId);
  if (!story) throw new Error(`Unable to upload image: no story was found for ID '${storyId}'`);
  story.addImageId(record.id);
  await story.save();

  res.json({ id: record.id, link: record.src });
}));

module.exports = router;
