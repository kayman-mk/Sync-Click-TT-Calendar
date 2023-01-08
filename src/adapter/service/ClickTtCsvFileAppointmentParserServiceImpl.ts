import csv from 'csv-parser';
import { AppointmentFactory, AppointmentInterface } from "../../domain/model/appointment/Appointment";
import { AppointmentParserService } from "../../domain/service/AppointmentParserService";
import { inject, injectable } from 'inversify';
import { SERVICE_IDENTIFIER } from '../../dependency_injection';
import { LoggerImpl } from '../LoggerImpl';
import { FileStorageService } from '../../domain/service/FileStorageService';
import { Readable } from 'stream';
import { DateTimeFormatter, LocalDateTime } from '@js-joda/core';
import { type } from 'os';

/**
 * Specification of the CSV file which can be downloaded from Click-TT
 */
type ClickTtCsvFile = {
    /**
     * The age group the teams are assigned to
     */
    Altersklasse: string
    /**
     * Number of the game in the league of the season.
     */
    BegegnungNr: number
    /**
     * Name of the foreign team
     */
    GastMannschaft: string
    /**
     * In case no match is planned for one round it is indicated with "spielfrei"
     */
    GastVereinName: "spielfrei" | string
    /**
     * Names the complete address: HalleName, HalleStrasse, HallePLZ and HalleOrt
     */
    HalleName: string
    HallePLZ: string
    HalleOrt: string
    HalleStrasse: string
    /**
     * Name of the local team
     */
    HeimMannschaft: string
    /**
     * Indicating if it is a match belonging to the cup, the first half of the season (VR) or
     * the last half of the season (RR).
     */
    Runde: "Pokal" | "VR" | "RR"
    /**
     * A division within the league
     */
    Staffel: string
    /**
     * The start date time in local timezone
     */
    Termin: string
}

@injectable()
export class ClickTtCsvFileAppointmentParserServiceImpl implements AppointmentParserService {
    constructor(@inject(SERVICE_IDENTIFIER.FileStorageService) readonly fileStorageService: FileStorageService, @inject(SERVICE_IDENTIFIER.Logger) readonly logger: LoggerImpl) { }

    async parseAppointments(filename: string): Promise<Set<AppointmentInterface>> {
        const appointments: Set<AppointmentInterface> = new Set();
        const csvDateTimeFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

        return new Promise((resolve, reject) => {
            Readable.from(this.fileStorageService.readFile(`${filename}`))
                .pipe(csv({ separator: ';' }))
                .on('data', (data: ClickTtCsvFile) => {
                    const startDateTime = LocalDateTime.parse(data.Termin, csvDateTimeFormatter)

                    if (data.GastVereinName != 'spielfrei') {
                        const location = data.HalleName + ", " + data.HalleStrasse + ", " + data.HallePLZ + " " + data.HalleOrt;
                        const isCup = data.Runde == 'Pokal'

                        appointments.add(AppointmentFactory.createFromCsv(data.HeimMannschaft, data.GastMannschaft, startDateTime, data.Staffel, data.BegegnungNr, location, data.Altersklasse, isCup, data.Runde));
                    } else {
                        this.logger.info("Appointment ignored. It's marked with 'spielfrei' " + startDateTime)
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