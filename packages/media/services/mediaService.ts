import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { DomainError } from '../../shared';
import { EventService } from '../../shared/';

export interface MediaConfig {
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  maxFileSize: number; // in bytes
}

export class MediaService {
  private s3Client: S3Client;
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/quicktime'
  ];

  constructor(
    private readonly config: MediaConfig,
    private readonly eventService: EventService
  ) {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  }

  async generatePresignedUrl(
    fileType: string,
    userId: string
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    if (!fileType) {
      throw new DomainError('File type is required');
    }

    if (!this.allowedMimeTypes.includes(fileType)) {
      throw new DomainError('Unsupported file type');
    }

    const extension = mime.extension(fileType);
    if (!extension) {
      throw new DomainError('Invalid file type');
    }

    const key = `uploads/${userId}/${uuidv4()}.${extension}`;
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      ContentType: fileType
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${key}`;

    await this.eventService.publishDomainEvent({
      eventName: 'media.presignedUrl.generated',
      payload: { userId, fileUrl }
    });

    return { uploadUrl, fileUrl };
  }

  async deleteMedia(fileUrl: string, userId: string): Promise<boolean> {
    if (!fileUrl) {
      throw new DomainError('File URL is required');
    }

    let key: string;
    try {
      key = this.getKeyFromUrl(fileUrl);
    } catch (error) {
      throw new DomainError('Invalid file URL');
    }

    if (!key.startsWith(`uploads/${userId}/`)) {
      throw new DomainError('Unauthorized to delete this media', 403);
    }

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: key
    });

    try {
      await this.s3Client.send(command);
      
      await this.eventService.publishDomainEvent({
        eventName: 'media.deleted',
        payload: { userId, fileUrl }
      });

      return true;
    } catch (error) {
      throw new DomainError('Failed to delete media');
    }
  }

  private getKeyFromUrl(fileUrl: string): string {
    try {
      const url = new URL(fileUrl);
      return decodeURIComponent(url.pathname.substring(1));
    } catch (error) {
      throw new DomainError('Invalid file URL');
    }
  }
} 