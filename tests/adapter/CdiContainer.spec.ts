import { CdiContainer, container } from "../../src/adapter/CdiContainer";
import { LoggerImpl } from "../../src/adapter/LoggerImpl";
import { CalDavCalendarServiceImpl } from "../../src/adapter/service/CalDavCalendarServiceImpl";
import { ClickTtCsvFileAppointmentParserServiceImpl } from "../../src/adapter/service/ClickTtCsvFileAppointmentParserServiceImpl";
import { LocalFileStorageServiceImpl } from "../../src/adapter/service/LocalFileStorageServiceImpl";
import { SyncCalendarApplicationService } from "../../src/application/SyncCalendarApplicationService";
import { CONFIGURATION, SERVICE_IDENTIFIER } from "../../src/dependency_injection";

describe('CDI Container', () => {
    it('should create all injectable implementations', () => {
        // given
        container.bindConfiguration(CONFIGURATION.AppointmentFilename, 'filename.csv');
        container.bindConfiguration(CONFIGURATION.CalendarUrl, 'https://caldav.local/');
        container.bindConfiguration(CONFIGURATION.CalendarUsername, 'caldav-user');
        container.bindConfiguration(CONFIGURATION.CalendarPassword, 'caldav-password');
        container.bindConfiguration(CONFIGURATION.ClubName, 'SC Kleckersdorf');

        // when
        container.startContainer()

        // then
        expect(container.getService(SERVICE_IDENTIFIER.SyncCalendarAppService)).toBeInstanceOf(SyncCalendarApplicationService)

        expect(container.getService(SERVICE_IDENTIFIER.AppointmentParserService)).toBeInstanceOf(ClickTtCsvFileAppointmentParserServiceImpl)
        expect(container.getService(SERVICE_IDENTIFIER.CalendarService)).toBeInstanceOf(CalDavCalendarServiceImpl)
        expect(container.getService(SERVICE_IDENTIFIER.FileStorageService)).toBeInstanceOf(LocalFileStorageServiceImpl)
        expect(container.getService(SERVICE_IDENTIFIER.Logger)).toBeInstanceOf(LoggerImpl)
        expect(container.getService(SERVICE_IDENTIFIER.TeamLeadRepository)).toBeDefined()
    })

    it('should create a CDI container', () => {
        // then
        expect(container).toBeInstanceOf(CdiContainer)
    })
})
