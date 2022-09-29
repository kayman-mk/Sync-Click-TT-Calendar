import { Container } from "inversify";

import { SERVICE_IDENTIFIER, CONFIGURATION } from "../dependency_injection";
import { Logger } from "./Logger";
import { SyncCalendarApplicationService } from "../application/SyncCalendarApplicationService";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";
import { ClickTtCsvFileAppointmentParserServiceImpl } from "./service/ClickTtCsvFileAppointmentParserServiceImpl";
import { FileStorageService } from "../domain/service/FileStorageService";
import { LocalFileStorageServiceImpl } from "./service/LocalFileStorageServiceImpl";
import { CalendarService } from "../domain/service/CalendarService";
import { CalDavCalendarServiceImpl } from "./service/CalDavCalendarServiceImpl";

export class CdiContainer {
    private static instance: CdiContainer;

    static getInstance(): CdiContainer {
        if (CdiContainer.instance == null) {
            CdiContainer.instance = new CdiContainer();
        }
        
        return CdiContainer.instance;
    }

    private container: Container = new Container();

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

export const container = CdiContainer.getInstance();