import { resolve } from "path";
import "reflect-metadata";
import { CdiContainer } from "../../../src/adapter/CdiContainer";

import { CommandLineInterface } from "../../../src/adapter/endpoint/CommandLineInterface";
import { SyncCalendarApplicationService } from "../../../src/application/SyncCalendarApplicationService";
import { CONFIGURATION, SERVICE_IDENTIFIER } from "../../../src/dependency_injection";

describe('CommandLineInterface', () => {
    it.skip('should accept mandatory parameters -c/--calendar-url and -f/--apointment-file', () => {
        CdiContainer.resetInstance();

        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.AppointmentFilename, "x.csv");
        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.CalendarUrl, "https://cal.local");
    
        // from environment
        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.CalendarUsername, "username");
        CdiContainer.getInstance().bindConfiguration(CONFIGURATION.CalendarPassword, "password");

        process.env.CALENDAR_USERNAME = "user";
        process.env.CALENDAR_PASSWORD = "password";

        CdiContainer.getInstance().startContainer();

        // given
        const givenArguments = [["-f", "x.csv", "-c", "https://under-test.local"], ["-appointment-file", "x.csv", "--calendar-url", "https://under-test.local"]];

        // const spy = jest.spyOn(CdiContainer.getInstance().getService<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService), 'service');
        // spy.mockImplementation();

        givenArguments.forEach(parameters => {
            //spy.mockReset();

            // when
            new CommandLineInterface().main(parameters);

            // then
            // expect(spy).toHaveBeenCalled();
            // expect(spy.mock.calls[0][0]).toBe("xxx.csv");
        });
    });
});
