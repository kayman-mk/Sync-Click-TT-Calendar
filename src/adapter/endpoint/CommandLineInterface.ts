import * as yargs from 'yargs';
import { Configuration } from '../Configuration';
import { Logger } from '../Logger';
import { DefaultUnitOfWork, UnitOfWork } from '../UnitOfWork';

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
    let unitOfWork: UnitOfWork = new DefaultUnitOfWork(configuration);

    unitOfWork.syncCalendarApplicationService.syncCalendar();
  }
}