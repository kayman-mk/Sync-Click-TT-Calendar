import "reflect-metadata";
import { CdiContainer } from "../../../src/adapter/CdiContainer";
import { CommandLineInterface } from "../../../src/adapter/endpoint/CommandLineInterface";

describe('CommandLineInterface', () => {
    beforeEach(() => {
        process.env.CALENDAR_USERNAME = "user";
        process.env.CALENDAR_PASSWORD = "password";
        process.env.CLUBNAME = "SC Test";
    });

    it('should_accept_appointment_file_parameter_when_provided', async () => {
        // given
        const givenArguments = ["-f", "x.csv", "-c", "https://under-test.local"];
        const mockSyncService = {
            syncCalendarFromTtvnDownloadCsv: jest.fn().mockResolvedValue(undefined),
            syncCalendarFromMyTischtennisWebpage: jest.fn().mockResolvedValue(undefined)
        };

        jest.spyOn(CdiContainer.getInstance(), 'getService').mockReturnValue(mockSyncService as any);
        jest.spyOn(CdiContainer.getInstance(), 'bindConfiguration').mockImplementation();
        jest.spyOn(CdiContainer.getInstance(), 'startContainer').mockImplementation();

        // when
        await new CommandLineInterface().main(givenArguments);

        // then
        expect(mockSyncService.syncCalendarFromTtvnDownloadCsv).toHaveBeenCalledWith("x.csv");
        expect(mockSyncService.syncCalendarFromMyTischtennisWebpage).not.toHaveBeenCalled();
    });

    it('should_accept_mytischtennis_url_parameter_when_provided', async () => {
        // given
        const givenArguments = ["-u", "https://mytischtennis.de/club/123", "-c", "https://under-test.local"];
        const mockSyncService = {
            syncCalendarFromTtvnDownloadCsv: jest.fn().mockResolvedValue(undefined),
            syncCalendarFromMyTischtennisWebpage: jest.fn().mockResolvedValue(undefined)
        };

        jest.spyOn(CdiContainer.getInstance(), 'getService').mockReturnValue(mockSyncService as any);
        jest.spyOn(CdiContainer.getInstance(), 'bindConfiguration').mockImplementation();
        jest.spyOn(CdiContainer.getInstance(), 'startContainer').mockImplementation();

        // when
        await new CommandLineInterface().main(givenArguments);

        // then
        expect(mockSyncService.syncCalendarFromMyTischtennisWebpage).toHaveBeenCalledWith("https://mytischtennis.de/club/123");
        expect(mockSyncService.syncCalendarFromTtvnDownloadCsv).not.toHaveBeenCalled();
    });

    it('should_throw_error_when_both_options_provided', async () => {
        // given
        const givenArguments = ["-f", "x.csv", "-u", "https://mytischtennis.de/club/123", "-c", "https://under-test.local"];

        // when / then
        await expect(new CommandLineInterface().main(givenArguments)).rejects.toThrow(
            'Please provide either --appointment-file or --mytischtennis-url, not both'
        );
    });

    it('should_throw_error_when_no_source_option_provided', async () => {
        // given
        const givenArguments = ["-c", "https://under-test.local"];

        // when / then
        await expect(new CommandLineInterface().main(givenArguments)).rejects.toThrow(
            'Please provide either --appointment-file or --mytischtennis-url'
        );
    });

    it('should_throw_error_when_clubname_not_set', async () => {
        // given
        delete process.env.CLUBNAME;
        const givenArguments = ["-f", "x.csv", "-c", "https://under-test.local"];

        // when / then
        await expect(new CommandLineInterface().main(givenArguments)).rejects.toThrow(
            'Missing CLUBNAME environment variable. Please set it in your .env file or environment.'
        );
    });

    it('should_throw_error_when_calendar_username_not_set', async () => {
        // given
        delete process.env.CALENDAR_USERNAME;
        const givenArguments = ["-f", "x.csv", "-c", "https://under-test.local"];

        // when / then
        await expect(new CommandLineInterface().main(givenArguments)).rejects.toThrow(
            'Missing CALENDAR_USERNAME or CALENDAR_PASSWORD environment variable. Please set them in your .env file or environment.'
        );
    });

    it('should_throw_error_when_calendar_password_not_set', async () => {
        // given
        delete process.env.CALENDAR_PASSWORD;
        const givenArguments = ["-f", "x.csv", "-c", "https://under-test.local"];

        // when / then
        await expect(new CommandLineInterface().main(givenArguments)).rejects.toThrow(
            'Missing CALENDAR_USERNAME or CALENDAR_PASSWORD environment variable. Please set them in your .env file or environment.'
        );
    });

    it('should_throw_error_when_both_calendar_credentials_not_set', async () => {
        // given
        delete process.env.CALENDAR_USERNAME;
        delete process.env.CALENDAR_PASSWORD;
        const givenArguments = ["-f", "x.csv", "-c", "https://under-test.local"];

        // when / then
        await expect(new CommandLineInterface().main(givenArguments)).rejects.toThrow(
            'Missing CALENDAR_USERNAME or CALENDAR_PASSWORD environment variable. Please set them in your .env file or environment.'
        );
    });
});
