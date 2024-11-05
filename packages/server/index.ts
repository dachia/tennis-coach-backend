import { bootstrapServer } from './server';
import { config as Config } from './config';
import { createContainer } from './di';

const container = createContainer(Config);
bootstrapServer(Config, container);
