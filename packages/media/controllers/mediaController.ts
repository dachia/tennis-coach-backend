import { Response } from 'express';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';
import { MediaService } from '../services/mediaService';

export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  async getPresignedUrl(req: AuthRequest, res: Response) {
    const { fileType } = req.body;

    const result = await this.mediaService.generatePresignedUrl(
      fileType,
      req.user._id
    );
    
    res.json(
      createResponse('success', 'Presigned URL generated successfully', result)
    );
  }

  async deleteMedia(req: AuthRequest, res: Response) {
    const { fileUrl } = req.body;

    await this.mediaService.deleteMedia(fileUrl, req.user._id);
    
    res.json(
      createResponse('success', 'Media deleted successfully')
    );
  }
} 