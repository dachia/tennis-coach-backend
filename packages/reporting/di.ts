import { Container, EventService, Transport } from "../shared";
import { ReportingController } from "./controllers/reportingController";
import { ReportingService } from "./services/reportingService";
import { ReportingTransportRouter } from "./transport/reportingTransportRouter";
import { ProgressComparison } from "./models/ProgressComparison";
import { TotalProgress } from "./models/TotalProgress";

export function addToContainer(container: Container) {
  const eventService = container.get<EventService>('EventService');
  const transport = container.get<Transport>('Transport');
  
  const reportingService = new ReportingService(
    ProgressComparison,
    TotalProgress,
    eventService,
    transport
  );
  
  const reportingController = new ReportingController(reportingService);
  const reportingTransportRouter = new ReportingTransportRouter(transport, reportingService);
  
  container.register('ReportingService', reportingService);
  container.register('ReportingController', reportingController);
  container.register('ReportingTransportRouter', reportingTransportRouter);
  
  return container;
} 