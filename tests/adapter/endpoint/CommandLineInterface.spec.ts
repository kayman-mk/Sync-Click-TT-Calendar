import "reflect-metadata";
import { CdiContainer } from "../../../src/adapter/CdiContainer";

import { CommandLineInterface } from "../../../src/adapter/endpoint/CommandLineInterface";
import { SyncCalendarApplicationService } from "../../../src/application/SyncCalendarApplicationService";
import { CONFIGURATION, SERVICE_IDENTIFIER } from "../../../src/dependency_injection";

describe('CommandLineInterface', () => {
    it('should accept -f/--appointment-file parameter', () => {
        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.AppointmentFilename, "under-test.csv");
        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.CalendarUrl, "https://cal.local");
    
        // from environment
        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.CalendarUsername, "username");
        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.CalendarPassword, "password");
    
        CdiContainer.getInstance().startContainer();

        // given
        const givenArguments = [["-f", "under-test.csv"], ["-appointment-file", "under-test.csv"]];

        const spy = jest.spyOn(CdiContainer.getInstance().getService<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService), 'syncCalendar');
        spy.mockImplementation();

        givenArguments.forEach(parameters => {
            spy.mockReset();

            // when
            new CommandLineInterface().main(parameters);

            // then
            expect(spy).toHaveBeenCalled();
            expect(spy.mock.calls[0][0]).toBe("xxx.csv");
        });
    });

    it('should accept -c/--calendar-url', () => {
        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.AppointmentFilename, "under-test.csv");
        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.CalendarUrl, "https://cal.local");
    
        // from environment
        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.CalendarUsername, "username");
        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.CalendarPassword, "password");
    
        CdiContainer.getInstance().startContainer();


        // given
        const givenArguments = [["-f", "xxx.csv", "-c", "https://under-test.local"], ["-appointment-file", "xxx.csv", "--calendar-url", "https://under-test.local"]];

        const spy = jest.spyOn(CdiContainer.getInstance().getService<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService), 'syncCalendar');
        spy.mockImplementation();

        givenArguments.forEach(parameters => {
            spy.mockReset();

            // when
            new CommandLineInterface().main(parameters);

            // then
            expect(spy).toHaveBeenCalled();
            expect(spy.mock.calls[0][0]).toBe("xxx.csv");
        });
    });
});
