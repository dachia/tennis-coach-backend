import { Container, EventService } from "../shared";
import { MediaController } from "./controllers/mediaController";
import { MediaService, MediaConfig } from "./services/mediaService";

export function addToContainer(container: Container) {
  const eventService = container.get<EventService>('EventService');
  const config = container.get<{ aws: { s3: MediaConfig } }>('Config');
  
  const mediaConfig: MediaConfig = {
    bucketName: config.aws.s3.bucketName,
    region: config.aws.s3.region,
    accessKeyId: config.aws.s3.accessKeyId,
    secretAccessKey: config.aws.s3.secretAccessKey,
    maxFileSize: config.aws.s3.maxFileSize
  };
  
  const mediaService = new MediaService(mediaConfig, eventService);
  const mediaController = new MediaController(mediaService);
  
  container.register('MediaService', mediaService);
  container.register('MediaController', mediaController);
} 