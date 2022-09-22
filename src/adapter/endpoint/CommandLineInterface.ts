import * as yargs from 'yargs';

export class CommandLineInterface {
  run() {
    const argv = yargs.options({
        'calendar-url': {
            alias: 'c',
            demandOption: true,
            description: 'URL of the caledar to update'
        }
      })
        .argv;
    
    console.log(argv);
  }
}