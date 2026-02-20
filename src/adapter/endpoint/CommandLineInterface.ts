import "reflect-metadata";

import { SyncCalendarApplicationService } from "../../application/SyncCalendarApplicationService";
import { CONFIGURATION, SERVICE_IDENTIFIER } from "../../dependency_injection";
import { container } from "../CdiContainer";

import yargs from 'yargs/yargs';

export class CommandLineInterface {
  async main(argv: string[]) {
    const parsedArguments = this.parseArguments(argv);

    // Validate that exactly one source option is provided
    const hasAppointmentFile = parsedArguments.appointmentFile !== undefined;
    const hasMyTischtennisUrl = parsedArguments.mytischtennisUrl !== undefined;

    if (hasAppointmentFile && hasMyTischtennisUrl) {
      throw new Error('Please provide either --appointment-file or --mytischtennis-url, not both');
    }

    if (!hasAppointmentFile && !hasMyTischtennisUrl) {
      throw new Error('Please provide either --appointment-file or --mytischtennis-url');
    }

    // Bind common configurations
    container.bindConfiguration(CONFIGURATION.CalendarUrl, parsedArguments.calendarUrl);

    // from environment
    container.bindConfiguration(CONFIGURATION.CalendarUsername, process.env.CALENDAR_USERNAME);
    container.bindConfiguration(CONFIGURATION.CalendarPassword, process.env.CALENDAR_PASSWORD);

    container.startContainer();

    const syncService = container.getService<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService);

    // Call the appropriate sync method based on the provided option
    if (hasAppointmentFile) {
      container.bindConfiguration(CONFIGURATION.AppointmentFilename, parsedArguments.appointmentFile);
      await syncService.syncCalendarFromTtvnDownloadCsv(parsedArguments.appointmentFile!);
    } else {
      await syncService.syncCalendarFromMyTischtennisWebpage(parsedArguments.mytischtennisUrl!);
    }
  }

  private parseArguments(argv: string[]) {
    return yargs(argv).options({
      'appointment-file': {
        alias: 'f',
        description: 'CSV file with all appointments (mutually exclusive with --mytischtennis-url)',
        type: 'string'
      },
      'mytischtennis-url': {
        alias: 'u',
        description: 'URL of the myTischtennis.de webpage to download and parse (mutually exclusive with --appointment-file)',
        type: 'string'
      },
      'calendar-url': {
        alias: 'c',
        demandOption: true,
        description: 'Url of the calendar to update',
        type: 'string'
      },
    }).parseSync();
  }
}
