import { Container } from "inversify";

import SERVICE_IDENTIFIER from "../dependency_injection";
import { Logger } from "./Logger";
import { Configuration } from "./Configuration";
import { SyncCalendarApplicationService } from "../application/SyncCalendarApplicationService";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";
import { ClickTtCsvFileAppointmentParserServiceImpl } from "./service/ClickTtCsvFileAppointmentParserServiceImpl";

let container = new Container();

container.bind<AppointmentParserService>(SERVICE_IDENTIFIER.AppointmentParserService).to(ClickTtCsvFileAppointmentParserServiceImpl);
container.bind<Logger>(SERVICE_IDENTIFIER.Logger).to(Logger);
container.bind<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService).to(SyncCalendarApplicationService);

export default container;