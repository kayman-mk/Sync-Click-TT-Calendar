import "reflect-metadata";

import * as yargs from 'yargs';
import { SyncCalendarApplicationService } from "../../application/SyncCalendarApplicationService";
import { SERVICE_IDENTIFIER } from "../../dependency_injection";
import container from "../container";

export class CommandLineInterface {
  main() {
    const args = yargs.options({
      'f': {
        alias: 'file',
        demandOption: true,
        description: 'CSV file with all appointments',
        type: 'string'
      }
    }).argv;

    // FIXME should read `args.f`
    container.get<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService).syncCalendar('/temp/Vereinsspielplan_20220922150454.csv');
  }
}