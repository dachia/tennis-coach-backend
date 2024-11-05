import { Container, InMemoryEventService, InMemoryTransport} from "../shared";
import { config as Config } from "./config";

export function createContainer(config: typeof Config) {
  const container = new Container();
  container.register('Config', config);

  // Setup event system
  const transport = new InMemoryTransport();
  container.register('Transport', transport);
  const eventService = new InMemoryEventService(transport);
  container.register('EventService', eventService);

  return container;
}

export function createTestContainer(config: typeof Config) {
  const container = createContainer(config);
  return container;
}
