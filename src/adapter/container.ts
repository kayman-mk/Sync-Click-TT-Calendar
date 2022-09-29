import inversify from "inversify";

import { SERVICE_IDENTIFIER, CONFIGURATION } from "../dependency_injection";
import { Logger } from "./Logger";
import { SyncCalendarApplicationService } from "../application/SyncCalendarApplicationService";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";
import { ClickTtCsvFileAppointmentParserServiceImpl } from "./service/ClickTtCsvFileAppointmentParserServiceImpl";
import { FileStorageService } from "../domain/service/FileStorageService";
import { LocalFileStorageServiceImpl } from "./service/LocalFileStorageServiceImpl";
import { CalendarService } from "../domain/service/CalendarService";
import { CalDavCalendarServiceImpl } from "./service/CalDavCalendarServiceImpl";

export class Container {
    private static instance: Container;

    static getInstance(): Container {
        if (Container.instance == null) {
            Container.instance = new Container();
        }
console.log(Container.instance);
        return Container.instance;
    }

    private container: inversify.Container = new inversify.Container();

    bindConfiguration(key: symbol, value: string | undefined): void {
        if (value !== undefined) {
            this.container.bind(key).toConstantValue(value);
        }
    }

    startContainer(): void {
        this.container.bind<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService).to(SyncCalendarApplicationService).inSingletonScope();

        this.container.bind<AppointmentParserService>(SERVICE_IDENTIFIER.AppointmentParserService).to(ClickTtCsvFileAppointmentParserServiceImpl).inSingletonScope();
        this.container.bind<CalendarService>(SERVICE_IDENTIFIER.CalendarService).to(CalDavCalendarServiceImpl).inSingletonScope();
        this.container.bind<FileStorageService>(SERVICE_IDENTIFIER.FileStorageService).to(LocalFileStorageServiceImpl).inSingletonScope();
        this.container.bind<Logger>(SERVICE_IDENTIFIER.Logger).to(Logger).inSingletonScope();
    }

    getService<T>(serviceIdentifier: symbol): T {
        return this.container.get<T>(serviceIdentifier);
    }
}