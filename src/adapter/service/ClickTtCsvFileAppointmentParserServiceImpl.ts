import csv from 'csv-parser';
import { Appointment, AppointmentFactory } from "../../domain/model/appointment/Appointment";
import { AppointmentParserService } from "../../domain/service/AppointmentParserService";
import { inject, injectable } from 'inversify';
import { SERVICE_IDENTIFIER } from '../../dependency_injection';
import { Logger } from '../Logger';
import { FileStorageService } from '../../domain/service/FileStorageService';
import { Readable } from 'stream';

@injectable()
export class ClickTtCsvFileAppointmentParserServiceImpl implements AppointmentParserService {
    constructor(@inject(SERVICE_IDENTIFIER.FileStorageService) readonly fileStorageService: FileStorageService, @inject(SERVICE_IDENTIFIER.Logger) readonly logger: Logger) { }

    async parseAppointments(filename: string): Promise<Set<Appointment>> {
        const appointments: Set<Appointment> = new Set();

        return new Promise((resolve, reject) => {
            Readable.from(this.fileStorageService.readFile(`${filename}`))
                .pipe(csv({ separator: ';' }))
                .on('data', (data) => {
                    if (data.GastVereinName != 'spielfrei') {
                        appointments.add(AppointmentFactory.create(data.HeimMannschaft, data.GastMannschaft, data.Termin, data.Staffel, data.BegegnungNr, data.HalleName + ", " + data.HalleStrasse + ", " + data.HallePLZ + " " + data.HalleOrt, data.Altersklasse, data.Runde == 'Pokal'));
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