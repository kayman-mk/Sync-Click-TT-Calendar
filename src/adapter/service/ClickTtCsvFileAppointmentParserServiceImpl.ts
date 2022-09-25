import * as fs from 'fs'; // 'fs/promises' not available in node 12
import csv from 'csv-parser';
import { Appointment, AppointmentFactory } from "../../domain/model/appointment/Appointment";
import { AppointmentParserService } from "../../domain/service/AppointmentParserService";
import { Configuration } from "../Configuration";
import { LocalDateTime } from '@js-joda/core';

export class ClickTtCsvFileAppointmentParserServiceImpl implements AppointmentParserService {
    constructor(readonly configuration: Configuration) { }

    parseAppointments(): Set<Appointment> {
        const results: Set<Appointment> = new Set();

        fs.createReadStream(`${this.configuration.clickTtAppointmentFilename}`)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => {
                results.add(AppointmentFactory.createFromClickTTCsv(data));
            });

        return results;
    }
}