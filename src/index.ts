import 'dotenv/config';
import { CommandLineInterface } from "./adapter/endpoint/CommandLineInterface";

// Execute the CLI and handle errors
process.argv.push('-u', 'https://www.mytischtennis.de/click-tt/TTVN/25--26/verein/3273800/SC_Klecken/spielplan', '-c', 'https://office1.matthiaskay.de/kayma/db66f6af-dca8-6395-a3b5-ec0fa69c99b9/');

new CommandLineInterface().main(process.argv).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
