import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class CloudflareService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get S3Client
   * @returns {S3Client} S3Client
   */
  getClient() {
    const ACCOUNT_ID = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');
    const ACCESS_KEY_ID = this.configService.get<string>(
      'CLOUDFLARE_ACCESS_KEY_ID',
    );
    const SECRET_ACCESS_KEY = this.configService.get<string>(
      'CLOUDFLARE_SECRET_ACCESS_KEY',
    );

    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    });
    return S3;
  }

  /**
   * Upload file from buffer
   * @param bucket Bucket name
   * @param key File name
   * @param buffer File buffer
   * @param contentType File content type
   * @returns {Promise<any>} Promise with bucket and key if success, false if failed
   */
  async uploadFileFromBuffer(
    bucket: string,
    key: string,
    buffer: any,
    contentType: string,
  ): Promise<any> {
    const S3 = this.getClient();

    const params = {
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    };

    // use multipartupload because stream has unknown length
    try {
      const multipartupload = new Upload({
        client: S3,
        params,
      });

      console.log('Uploading file...');
      const res = await multipartupload.done();
      console.log('Upload complete');

      return res;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
