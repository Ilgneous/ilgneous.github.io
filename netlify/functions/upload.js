const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2',
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Assume base64 encoded data is sent as JSON
    const body = JSON.parse(event.body);
    const buffer = Buffer.from(body.fileContent, 'base64');

    const params = {
      Bucket: process.env.MY_S3_BUCKET_NAME,
      Key: body.fileName,
      Body: buffer,
      ContentType: 'application/pdf',
    };

    await s3.upload(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File uploaded successfully!' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'File upload failed!' }),
    };
  }
};
