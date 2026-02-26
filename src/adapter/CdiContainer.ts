import { Container } from "inversify";
import * as path from "node:path";

import { SERVICE_IDENTIFIER } from "../dependency_injection";
import { LoggerImpl } from "./LoggerImpl";
import { SyncCalendarApplicationService } from "../application/SyncCalendarApplicationService";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";
import { ClickTtCsvFileAppointmentParserServiceImpl } from "./service/ClickTtCsvFileAppointmentParserServiceImpl";
import { FileStorageService } from "../domain/service/FileStorageService";
import { LocalFileStorageServiceImpl } from "./service/LocalFileStorageServiceImpl";
import { CalendarService } from "../domain/service/CalendarService";
import { CalDavCalendarServiceImpl } from "./service/CalDavCalendarServiceImpl";
import { SportsHallRepository } from "../domain/service/SportsHallRepository";
import { FileSportsHallRepositoryImpl } from "./service/FileSportsHallRepositoryImpl";
import { SportsHallRemoteService } from "../domain/service/SportsHallRemoteService";
import { HttpSportsHallRemoteService } from "./service/HttpSportsHallRemoteService";
import { WebPageService } from "../domain/service/WebPageService";
import { AxiosWebPageService } from "./service/AxiosWebPageService";
import { TeamLeadRepository } from "../domain/service/TeamLeadRepository";
import { FileTeamLeadRepositoryImpl } from "./service/FileTeamLeadRepositoryImpl";
import winston from "winston";

export class CdiContainer {
    private static instance: CdiContainer;

    static getInstance(): CdiContainer {
        CdiContainer.instance ??= new CdiContainer();
        return CdiContainer.instance;
    }

    container: Container = new Container();

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
        this.container.bind<SportsHallRepository>(SERVICE_IDENTIFIER.SportsHallRepository).toDynamicValue((context) => {
            const fileStorageService = context.container.get<FileStorageService>(SERVICE_IDENTIFIER.FileStorageService);
            const remoteService = context.container.get<SportsHallRemoteService>(SERVICE_IDENTIFIER.SportsHallRemoteService);
            const logger = context.container.get<LoggerImpl>(SERVICE_IDENTIFIER.Logger);
            const filePath = path.join(process.cwd(), "sports_halls.json");
            return new FileSportsHallRepositoryImpl(filePath, fileStorageService, remoteService, logger);
        }).inSingletonScope();
        this.container.bind<LoggerImpl>(SERVICE_IDENTIFIER.Logger).toConstantValue(new LoggerImpl(new winston.transports.Console()));
        this.container.bind<TeamLeadRepository>(SERVICE_IDENTIFIER.TeamLeadRepository).toDynamicValue((context) => {
            const filePath = path.join(process.cwd(), "team_leads.json");
            const fileStorageService = context.container.get<FileStorageService>(SERVICE_IDENTIFIER.FileStorageService);
            const logger = context.container.get<LoggerImpl>(SERVICE_IDENTIFIER.Logger);
            return new FileTeamLeadRepositoryImpl(filePath, fileStorageService, logger);
        }).inSingletonScope();
        this.container.bind<WebPageService>(SERVICE_IDENTIFIER.WebPageService).to(AxiosWebPageService).inSingletonScope();
        this.container.bind<SportsHallRemoteService>(SERVICE_IDENTIFIER.SportsHallRemoteService).to(HttpSportsHallRemoteService).inSingletonScope();
    }

    getService<T>(serviceIdentifier: symbol): T {
        return this.container.get<T>(serviceIdentifier);
    }
}

export const container = CdiContainer.getInstance();
