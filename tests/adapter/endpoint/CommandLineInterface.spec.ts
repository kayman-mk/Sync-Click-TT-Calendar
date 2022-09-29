import container from "../../../src/adapter/container";

import { CommandLineInterface } from "../../../src/adapter/endpoint/CommandLineInterface";
import { SyncCalendarApplicationService } from "../../../src/application/SyncCalendarApplicationService";
import { SERVICE_IDENTIFIER } from "../../../src/dependency_injection";

describe('CommandLineInterface', () => {
    it('should accept -f/--appointment-file parameter', () => {
        // given
        const givenArguments = [["-f", "under-test.csv"], ["-appointment-file", "under-test.csv"]];

        const spy = jest.spyOn(container.get<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService), 'syncCalendar');
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
        // given
        const givenArguments = [["-f", "xxx.csv", "-c", "https://under-test.local"], ["-appointment-file", "xxx.csv", "--calendar-url", "https://under-test.local"]];

        const spy = jest.spyOn(container.get<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService), 'syncCalendar');
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
