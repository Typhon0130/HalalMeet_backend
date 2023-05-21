const express = require('express');
const router = express.Router();
const FileService = require('../services/FileService')
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

router.get('/:fileName', async (req, res) => {
  try {
    s3.getObject({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: req.params.fileName }, function(err, data) {
      if (err) {
        console.log('ERROR IN LOADING FILE: ')
        return res.status(400).json('MISSING IMG')
      }
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.write(data.Body, 'binary');
      return res.end(null, 'binary');
    });
  } catch (e) {
    return res.status(400).json('INTERNAL_SERVER_ERROR')
  }
})

module.exports = router;
