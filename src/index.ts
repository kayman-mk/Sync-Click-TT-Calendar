import { DateTimeFormatter, LocalDateTime } from "@js-joda/core";
import { exit } from "process";
import { CommandLineInterface } from "./adapter/endpoint/CommandLineInterface";

// for simplicity
new CommandLineInterface().main(process.argv);