import * as fs from 'fs'; // 'fs/promises' not available in node 12
import os from 'os';
import { parse } from 'csv-parse';
import { Appointment } from "../../../domain/model/appointment/Appointment";
import { AppointmentParserService } from "../../../domain/service/AppointmentParserService";
import { Configuration } from "../../Configuration";

export class AppointmentParserServiceImpl implements AppointmentParserService {
    constructor(readonly configuration: Configuration) { }

    parseAppointments(): Promise<Set<Appointment>> {
        fs.createReadStream("./x.csv")
  .pipe(parse({ delimiter: ",", from_line: 2 }))
  .on("data", function (row) {
    console.log(row);
  })
  .on("end", function () {
    console.log("finished");
  })
  .on("error", function (error) {
    console.log(error.message);
  });
        
        throw new Error("Method not implemented.");
    }
}