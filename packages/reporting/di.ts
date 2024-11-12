import { Container, EventService, Transport, WorkoutTransportClient } from "../shared";
import { ReportingController } from "./controllers/reportingController";
import { ReportingService } from "./services/reportingService";
import { ReportingTransportRouter } from "./transport/reportingTransportRouter";
import { ProgressComparison } from "./models/ProgressComparison";
import { TotalProgress } from "./models/TotalProgress";
import { ReportingQueryService } from "./services/reportingQueryService";

export function addToContainer(container: Container) {
  const transport = container.get<Transport>('Transport');
  const workoutTransportClient = new WorkoutTransportClient(transport);
  
  const reportingService = new ReportingService(
    ProgressComparison,
    workoutTransportClient
  );
  
  const reportingQueryService = new ReportingQueryService(
    ProgressComparison
  );
  
  const reportingController = new ReportingController(reportingService, reportingQueryService);
  const reportingTransportRouter = new ReportingTransportRouter(transport, reportingService);
  
  container.register('ReportingService', reportingService);
  container.register('ReportingQueryService', reportingQueryService);
  container.register('ReportingController', reportingController);
  container.register('ReportingTransportRouter', reportingTransportRouter);
  
  return container;
} 