import { Container } from "inversify";

import SERVICE_IDENTIFIER from "../dependency_injection";
import { Logger } from "./Logger";
import { Configuration } from "./Configuration";
import { SyncCalendarApplicationService } from "../application/SyncCalendarApplicationService";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";
import { ClickTtCsvFileAppointmentParserServiceImpl } from "./service/ClickTtCsvFileAppointmentParserServiceImpl";
import { FileStorageService } from "../domain/service/FileStorageService";
import { LocalFileStorageService } from "./service/LocalFileStorageService";

let container = new Container();

container.bind<AppointmentParserService>(SERVICE_IDENTIFIER.AppointmentParserService).to(ClickTtCsvFileAppointmentParserServiceImpl).inSingletonScope();
container.bind<FileStorageService>(SERVICE_IDENTIFIER.FileStorageService).to(LocalFileStorageService).inSingletonScope();
container.bind<Logger>(SERVICE_IDENTIFIER.Logger).to(Logger).inSingletonScope();
container.bind<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService).to(SyncCalendarApplicationService).inSingletonScope();

export default container;