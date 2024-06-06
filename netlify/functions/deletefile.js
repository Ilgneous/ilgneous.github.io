const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2',
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed', headers: { 'Content-Type': 'application/json' } };
  }

  try {
    const { fileName } = JSON.parse(event.body);  // Extract filename from the body
    const params = {
      Bucket: process.env.MY_S3_BUCKET_NAME,
      Key: fileName,
    };

    await s3.deleteObject(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File deleted successfully' }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
