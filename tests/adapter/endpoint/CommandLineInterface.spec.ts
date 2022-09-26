import container from "../../../src/adapter/container";

import { CommandLineInterface } from "../../../src/adapter/endpoint/CommandLineInterface";
import { SyncCalendarApplicationService } from "../../../src/application/SyncCalendarApplicationService";
import { SERVICE_IDENTIFIER } from "../../../src/dependency_injection";

describe('CommandLineInterface', () => {
    it('should accept -f parameter', () => {
        // give
        const givenArguments = ["-f", "xxx.csv"];

        const spy = jest.spyOn(container.get<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService), 'syncCalendar');
        spy.mockImplementation();

        // when
        new CommandLineInterface().main(givenArguments);

        // then
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toBe("xxx.csv");
    });

    it('should accept --appointment-file parameter', () => {
        // given
        const givenArguments = ["--appointment-file", "xxx.csv"];

        const spy = jest.spyOn(container.get<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService), 'syncCalendar');
        spy.mockImplementation();

        // when
        new CommandLineInterface().main(givenArguments);

        // then
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toBe("xxx.csv");
    });
});
