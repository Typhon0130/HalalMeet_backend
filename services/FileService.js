const path = require("path");
const fs = require('fs');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const uploadFileToAWS = async (fileName) => {
  try {
    return new Promise((resolve, reject) => {
      const imagePath = path.join(__dirname, "/../public/images");
      fs.readFile(imagePath + '/' + fileName, (err, data) => {
        if (err) return err;
        const params = {
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: data,
          ACL: 'public-read'
        };
        s3.upload(params).promise()
          .then((data) => {
            console.log(`File uploaded successfully at ${data.Location}`)
            resolve()
          })
          .catch(error => {
            console.log(error)
            reject ()
          })
      })
    });
  } catch (e) {
    console.log(e);
  }
};

const deleteFileFromAWS = (fileName) => {
  return new Promise((resolve, reject) => {
    s3.deleteObject({ Bucket: BUCKET_NAME, Key: fileName }, function (err, data) {
      if (err) {
        console.log(err)
        reject()
      }
      resolve()
    })
  })
};

module.exports = {
  uploadFileToAWS,
  deleteFileFromAWS
}