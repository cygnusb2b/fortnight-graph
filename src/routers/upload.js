const { Router } = require('express');
const helmet = require('helmet');
const multer = require('multer');
const ImageRepo = require('../repositories/image');

const router = Router();
router.use(helmet());

const { IMGIX_URL } = process.env;
const storage = ImageRepo.getMulterStorage();
const upload = multer({ storage });

router.post('/embedded-image', upload.single('file'), (req, res) => {
  // console.info(req.file);
  const { file } = req;
  const { key } = file;

  const [id, filename] = key.split('/');

  const link = `${IMGIX_URL}/${id}/${encodeURIComponent(filename)}?auto=format&fm=jpg`;
  res.json({ link });
});

module.exports = router;
