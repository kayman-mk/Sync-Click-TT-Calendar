import csv from 'csv-parser';
import { AppointmentFactory, AppointmentInterface } from "../../domain/model/appointment/Appointment";
import { AppointmentParserService } from "../../domain/service/AppointmentParserService";
import { inject, injectable } from 'inversify';
import { SERVICE_IDENTIFIER } from '../../dependency_injection';
import { Logger } from '../Logger';
import { FileStorageService } from '../../domain/service/FileStorageService';
import { Readable } from 'stream';
import { DateTimeFormatter, LocalDateTime } from '@js-joda/core';

@injectable()
export class ClickTtCsvFileAppointmentParserServiceImpl implements AppointmentParserService {
    constructor(@inject(SERVICE_IDENTIFIER.FileStorageService) readonly fileStorageService: FileStorageService, @inject(SERVICE_IDENTIFIER.Logger) readonly logger: Logger) { }

    async parseAppointments(filename: string): Promise<Set<AppointmentInterface>> {
        const appointments: Set<AppointmentInterface> = new Set();
        const formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

        return new Promise((resolve, reject) => {
            Readable.from(this.fileStorageService.readFile(`${filename}`))
                .pipe(csv({ separator: ';' }))
                .on('data', (data) => {
                    if (data.GastVereinName != 'spielfrei') {
                        const startDateTime = LocalDateTime.parse(data.Termin, formatter)
                        const location = data.HalleName + ", " + data.HalleStrasse + ", " + data.HallePLZ + " " + data.HalleOrt;
                        const isCup = data.Runde == 'Pokal'

                        appointments.add(AppointmentFactory.createFromCsv(data.HeimMannschaft, data.GastMannschaft, startDateTime, data.Staffel, data.BegegnungNr, location, data.Altersklasse, isCup));
                    }
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