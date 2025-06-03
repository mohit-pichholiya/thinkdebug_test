const express = require('express');
const router = express.Router();

const {
  login,
  signup,
  uploadFile,
  downloadFile,
  getAuditLogs,
  getOrgFiles,
  getDownloadStats
} = require('./controller'); 

const { authenticate, adminOnly } = require('./middleware/jwt_token_verify');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // or your custom multer config


router.post('/login', login);
router.post('/signup', signup);


router.post('/files/upload', authenticate, upload.single('file'), uploadFile);
router.get('/files/:id/download', authenticate, downloadFile);


router.get('/audit', authenticate, adminOnly, getAuditLogs);


router.get('/orgs/:orgId/files', authenticate, adminOnly, getOrgFiles);
router.get('/files/stats',authenticate,adminOnly , getDownloadStats);

module.exports = router;
