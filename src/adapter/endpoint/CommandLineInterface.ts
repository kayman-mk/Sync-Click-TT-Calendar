import * as yargs from 'yargs';
import { Configuration } from '../Configuration';
import { Logger } from '../Logger';
import { UnitOfWork } from '../UnitOfWork';

export class CommandLineInterface {
  main() {
    const args = yargs.options({
        's': {
            alias: 'click-tt-url',
            default: 'https://ttvn.click-tt.de/',
            demandOption: true,
            description: 'URL of the Click-TT instance to use.',
            type: 'string'
        }
      }).argv;
    
    let configuration: Configuration = new Configuration(argv.verbose);
    let unitOfWork: UnitOfWork = new UnitOfWork(configuration, new Logger(configuration));
  }
}