import { SyncCalendarApplicationService as SyncCalendarApplicationService } from "../application/SyncCalendarApplicationService";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";
import { Configuration } from "./Configuration";
import { AppointmentParserServiceImpl } from "./endpoint/service/AppointmentParserServiceImpl";
import { Logger } from "./Logger";

export abstract class UnitOfWork {
    constructor(readonly appointmentParserService: AppointmentParserService, readonly syncCalendarApplicationService: SyncCalendarApplicationService, readonly configuration: Configuration, readonly logger: Logger) {}
}

export class DefaultUnitOfWork extends UnitOfWork {
    constructor(configuration: Configuration) {
        const appointmentParser = new AppointmentParserServiceImpl(configuration);
        super(appointmentParser, new SyncCalendarApplicationService(appointmentParser), configuration, new Logger(configuration));
    }
}