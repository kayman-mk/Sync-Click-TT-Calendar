import "reflect-metadata";

import { SyncCalendarApplicationService } from "../../application/SyncCalendarApplicationService";
import { CONFIGURATION, SERVICE_IDENTIFIER } from "../../dependency_injection";
import { container } from "../CdiContainer";

import yargs from 'yargs/yargs';

export class CommandLineInterface {
  main(argv: string[]) {
    const parsedArguments = this.parseArguments(argv);

    container.bindConfiguration(CONFIGURATION.AppointmentFilename, parsedArguments.appointmentFile);
    container.bindConfiguration(CONFIGURATION.CalendarUrl, parsedArguments.calendarUrl);

    // from environment
    container.bindConfiguration(CONFIGURATION.CalendarUsername, process.env.CALENDAR_USERNAME);
    container.bindConfiguration(CONFIGURATION.CalendarPassword, process.env.CALENDAR_PASSWORD);

    container.startContainer();

    container.getService<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService).syncCalendarFromTtvnDownloadCsv(parsedArguments.appointmentFile);
  }

  private parseArguments(argv: string[]) {
    return yargs(argv).options({
      'appointment-file': {
        alias: 'f',
        demandOption: true,
        description: 'CSV file with all appointments',
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
