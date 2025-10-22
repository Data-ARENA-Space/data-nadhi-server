const { Client } = require('minio');

class MinioService {
  constructor() {
    if (MinioService.instance) {
      return MinioService.instance;
    }

    this.endPoint = process.env.MINIO_ENDPOINT || 'datanadhi-minio';
    this.port = parseInt(process.env.MINIO_PORT || '9000', 10);
    this.accessKey = process.env.MINIO_ACCESS_KEY || 'minio';
    this.secretKey = process.env.MINIO_SECRET_KEY || 'minio123';
    this.bucketName = process.env.MINIO_BUCKET || 'failure-logs';
    this.useSSL = process.env.MINIO_USE_SSL === 'true';

    this.client = new Client({
      endPoint: this.endPoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: this.accessKey,
      secretKey: this.secretKey
    });

    // Ensure bucket exists
    this.ensureBucket();

    MinioService.instance = this;
  }

  async ensureBucket() {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName);
      }
    } catch (err) {
      console.error(`Warning: Could not create bucket ${this.bucketName}:`, err.message);
    }
  }

  /**
   * Upload JSON data to MinIO
   * @param {string} objectPath - Path within bucket (e.g., "org/project/pipeline/message.json")
   * @param {object} data - Object to upload as JSON
   * @returns {Promise<boolean>} - True if successful, false otherwise
   */
  async uploadJson(objectPath, data) {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      const buffer = Buffer.from(jsonData, 'utf-8');

      await this.client.putObject(
        this.bucketName,
        objectPath,
        buffer,
        buffer.length,
        {
          'Content-Type': 'application/json'
        }
      );

      return true;
    } catch (err) {
      console.error('Failed to upload to MinIO:', err.message);
      return false;
    }
  }
}

module.exports = new MinioService();
