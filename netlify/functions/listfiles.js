const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2',
});

exports.handler = async (event) => {
  const params = {
    Bucket: process.env.MY_S3_BUCKET_NAME,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const files = data.Contents.map(file => {
      const url = s3.getSignedUrl('getObject', {
        Bucket: process.env.MY_S3_BUCKET_NAME,
        Key: file.Key,
        Expires: 3600 // URL expires in 1 hour
      });
      return { key: file.Key, url };
    });
    return {
      statusCode: 200,
      body: JSON.stringify(files),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
