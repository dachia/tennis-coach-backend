import { Container, InMemoryEventService, InMemoryEventStorage } from "../shared";
import { config as Config } from "./config";

export function createContainer(config: typeof Config) {
  const container = new Container();
  container.register('Config', config);

  // Setup event system
  const eventStorage = new InMemoryEventStorage();
  const eventService = new InMemoryEventService(eventStorage);
  container.register('EventService', eventService);

  return container;
}

export function createTestContainer(config: typeof Config) {
  const container = createContainer(config);
  return container;
}
