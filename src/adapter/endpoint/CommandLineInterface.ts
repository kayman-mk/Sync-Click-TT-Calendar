import "reflect-metadata";

import { SyncCalendarApplicationService } from "../../application/SyncCalendarApplicationService";
import { CONFIGURATION, SERVICE_IDENTIFIER } from "../../dependency_injection";
import { Container } from "../Container";

import yargs from 'yargs/yargs';

export class CommandLineInterface {
  main(argv: string[]) {
    const parsedArguments = this.parseArguments(argv);

    Container.getInstance().bindConfiguration(CONFIGURATION.AppointmentFilename, parsedArguments.appointmentFile);
    Container.getInstance().bindConfiguration(CONFIGURATION.CalendarUrl, parsedArguments.calendarUrl);

    // from environment
    Container.getInstance().bindConfiguration(CONFIGURATION.CalendarUsername, process.env.CALENDAR_USERNAME);
    Container.getInstance().bindConfiguration(CONFIGURATION.CalendarPassword, process.env.CALENDAR_PASSWORD);

    Container.getInstance().getService<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService).syncCalendar(parsedArguments.appointmentFile);
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
