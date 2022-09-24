import * as yargs from 'yargs';
import { Configuration } from '../Configuration';
import { Logger } from '../Logger';
import { DefaultUnitOfWork, UnitOfWork } from '../UnitOfWork';

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

    // FIXME should read `args.s`
    let configuration: Configuration = new Configuration('https://ttvn.click-tt.de/');
    let unitOfWork: UnitOfWork = new DefaultUnitOfWork(configuration);
  }
}