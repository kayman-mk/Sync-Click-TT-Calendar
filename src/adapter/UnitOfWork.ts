import { SyncCalendarApplicationService as SyncCalendarApplicationService } from "../application/SyncCalendarApplicationService";
import { ClickTTService } from "../domain/service/ClickTTService";
import { Configuration } from "./Configuration";
import { ClickTTServiceImpl } from "./endpoint/service/ClickTTServiceImpl";
import { Logger } from "./Logger";

export abstract class UnitOfWork {
    constructor(readonly clickTTService: ClickTTService, readonly syncCalendarApplicationService: SyncCalendarApplicationService, readonly configuration: Configuration, readonly logger: Logger) {}
}

export class DefaultUnitOfWork extends UnitOfWork {
    constructor(configuration: Configuration) {
        super(new ClickTTServiceImpl(configuration), new SyncCalendarApplicationService(), configuration, new Logger(configuration));
    }
}