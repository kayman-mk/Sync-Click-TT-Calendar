import "reflect-metadata";

import { SyncCalendarApplicationService } from "../../application/SyncCalendarApplicationService";
import { SERVICE_IDENTIFIER } from "../../dependency_injection";
import container from "../container";

import yargs from 'yargs/yargs';

export class CommandLineInterface {
  main(args: string[]) {
    const parsedArguments = this.extractArguments(args);

    container.get<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService).syncCalendar(parsedArguments.appointmentFile);
  }

  private extractArguments(args: string[]) {
    return yargs(args).options({
      'appointment-file': {
        alias: 'f',
        demandOption: true,
        description: 'CSV file with all appointments',
        type: 'string'
      }
    }).parseSync();
  }
}
