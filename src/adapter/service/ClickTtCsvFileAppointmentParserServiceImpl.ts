import * as fs from 'fs'; // 'fs/promises' not available in node 12
import csv from 'csv-parser';
import { Appointment, AppointmentFactory } from "../../domain/model/appointment/Appointment";
import { AppointmentParserService } from "../../domain/service/AppointmentParserService";
import { Configuration } from "../Configuration";
import { inject, injectable } from 'inversify';
import SERVICE_IDENTIFIER from '../../dependency_injection';
import { Logger } from '../Logger';
import { FileStorageService } from '../../domain/service/FileStorageService';
import { Readable } from 'stream';

@injectable()
export class ClickTtCsvFileAppointmentParserServiceImpl implements AppointmentParserService {
    constructor(@inject(SERVICE_IDENTIFIER.FileStorageService) readonly fileStorageService: FileStorageService, @inject(SERVICE_IDENTIFIER.Logger) readonly logger: Logger, @inject(SERVICE_IDENTIFIER.Configuration) readonly configuration: Configuration) { }

    async parseAppointments(): Promise<Set<Appointment>> {
        const appointments: Set<Appointment> = new Set();

        return new Promise((resolve, reject) => {
            Readable.from(this.fileStorageService.readFile(`${this.configuration.clickTtAppointmentFilename}`))
                .pipe(csv({ separator: ';' }))
                .on('data', (data) => {
                    appointments.add(AppointmentFactory.createFromClickTTCsv(data));
                })
                .on('end', () => {
                    this.logger.info("Found " + appointments.size + " appointments in CSV file.");

                    resolve(appointments)
                })
                .on('error', (err) => {
                    return reject(err);
                });
        })
    }
}