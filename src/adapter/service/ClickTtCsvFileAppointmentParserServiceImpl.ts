import * as fs from 'fs'; // 'fs/promises' not available in node 12
import csv from 'csv-parser';
import { Appointment, AppointmentFactory } from "../../domain/model/appointment/Appointment";
import { AppointmentParserService } from "../../domain/service/AppointmentParserService";
import { Configuration } from "../Configuration";
import { inject, injectable } from 'inversify';
import SERVICE_IDENTIFIER from '../../dependency_injection';
import { Logger } from '../Logger';

@injectable()
export class ClickTtCsvFileAppointmentParserServiceImpl implements AppointmentParserService {
    constructor(@inject(SERVICE_IDENTIFIER.Logger) readonly logger: Logger, @inject(SERVICE_IDENTIFIER.Configuration) readonly configuration: Configuration) { }

    parseAppointments(): Set<Appointment> {
        const results: Set<Appointment> = new Set();

        fs.createReadStream(`${this.configuration.clickTtAppointmentFilename}`)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => {
                results.add(AppointmentFactory.createFromClickTTCsv(data));
            });

        this.logger.info("Found " + results.size + " appointments in CSV file.");

        return results;
    }
}