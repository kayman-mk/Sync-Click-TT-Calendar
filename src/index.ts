import { CommandLineInterface } from "./adapter/endpoint/CommandLineInterface";

// Execute the CLI and handle errors
new CommandLineInterface().main(process.argv).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

