import "reflect-metadata";

import * as yargs from 'yargs';
import { SyncCalendarApplicationService } from "../../application/SyncCalendarApplicationService";
import SERVICE_IDENTIFIER from "../../dependency_injection";
import { Configuration } from '../Configuration';
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
    let configuration: Configuration = new Configuration('/temp/Vereinsspielplan_20220922150454.csv');
    container.bind<Configuration>(SERVICE_IDENTIFIER.Configuration).toConstantValue(configuration);

    container.get<SyncCalendarApplicationService>(SERVICE_IDENTIFIER.SyncCalendarAppService).syncCalendar();
  }
}