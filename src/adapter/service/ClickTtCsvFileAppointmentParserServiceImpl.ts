import csv from 'csv-parser';
import { AppointmentFactory, AppointmentInterface } from "../../domain/model/Appointment";
import { AppointmentParserService } from "../../domain/service/AppointmentParserService";
import { inject, injectable } from 'inversify';
import { SERVICE_IDENTIFIER, CONFIGURATION } from '../../dependency_injection';
import { Logger } from '../../domain/service/Logger';
import { FileStorageService } from '../../domain/service/FileStorageService';
import { TeamLeadRepository } from '../../domain/service/TeamLeadRepository';
import { TeamLead } from '../../domain/model/TeamLead';
import { Readable } from 'node:stream';
import { DateTimeFormatter, LocalDateTime } from '@js-joda/core';

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
    GastVereinName: string
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
    constructor(
        @inject(SERVICE_IDENTIFIER.FileStorageService) readonly fileStorageService: FileStorageService,
        @inject(SERVICE_IDENTIFIER.Logger) readonly logger: Logger,
        @inject(SERVICE_IDENTIFIER.TeamLeadRepository) readonly teamLeadRepository: TeamLeadRepository,
        @inject(CONFIGURATION.ClubName) readonly clubName: string
    ) { }

    async parseAppointments(filename: string): Promise<Set<AppointmentInterface>> {
        const csvDateTimeFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
        const csvContent = await this.fileStorageService.readFile(`${filename}`);
        const appointments: Set<AppointmentInterface> = new Set();

        return new Promise((resolve, reject) => {
            // Collect all rows first
            const rows: ClickTtCsvFile[] = [];

            Readable.from([csvContent])
                .pipe(csv({ separator: ';' }))
                .on('data', (data: ClickTtCsvFile) => {
                    rows.push(data);
                })
                .on('end', async () => {
                    // Process all rows sequentially after CSV parsing is complete
                    try {
                        for (const data of rows) {
                            // Clean the datetime string: remove trailing characters like "v" (indicating moved appointments)
                            // and day-of-week prefixes like "Mo., " before parsing
                            let cleanedTermin = data.Termin.trim();

                            // Remove day-of-week prefix (e.g., "Mo., " or "Di., ")
                            cleanedTermin = cleanedTermin.replace(/^[A-Za-z]{2}\.,?\s*/, '');

                            // Remove trailing non-time characters (like "v" for "verlegt" = moved)
                            // Keep only: dd.MM.yyyy HH:mm
                            const dateTimeMatch = new RegExp(/(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2})/).exec(cleanedTermin);
                            if (dateTimeMatch) {
                                cleanedTermin = dateTimeMatch[1];
                            }

                            // Check for required columns
                            const requiredFields = [data.Termin, data.Staffel, data.Runde, data.HeimMannschaft, data.GastMannschaft, data.BegegnungNr];
                            if (requiredFields.some(field => field === undefined || field === '')) {
                                this.logger.warning("Skipping row due to missing required columns.");
                                continue;
                            }

                            try {
                                const startDateTime = LocalDateTime.parse(cleanedTermin, csvDateTimeFormatter)
                                if (data.GastVereinName != 'spielfrei') {
                                    const location = data.HalleName || data.HalleStrasse || data.HallePLZ || data.HalleOrt ? data.HalleName?.trim() + ", " + data.HalleStrasse?.trim() + ", " + data.HallePLZ?.trim() + " " + data.HalleOrt?.trim() : '';
                                    const isCup = data.Runde == 'Pokal'

                                    // Look up team lead for the home team with age class and round
                                    let teamLead: TeamLead;

                                    let mannschaft = data.GastMannschaft;
                                    if (data.HeimMannschaft.includes(this.clubName)) {
                                        mannschaft = data.HeimMannschaft;
                                    }

                                    try {
                                        const foundTeamLead = await this.teamLeadRepository.findByTeamNameAndAgeClass(mannschaft, data.Altersklasse, data.Runde);
                                        if (foundTeamLead) {
                                            this.logger.debug(`Found team lead for team "${mannschaft}" (${data.Altersklasse}, ${data.Runde}): ${foundTeamLead.fullName}`);
                                            teamLead = foundTeamLead;
                                        } else {
                                            this.logger.debug(`No team lead found for team "${mannschaft}" (${data.Altersklasse}, ${data.Runde})`);
                                            // Create a default team lead with the team name
                                            teamLead = new TeamLead(mannschaft, mannschaft, data.Altersklasse, data.Runde, "");
                                        }
                                    } catch (error) {
                                        this.logger.info(`Error looking up team lead for "${mannschaft}"`);
                                        // Create a default team lead on error
                                        teamLead = new TeamLead(mannschaft, mannschaft, data.Altersklasse, data.Runde, "");
                                    }

                                    appointments.add(AppointmentFactory.createFromCsv({
                                        localTeam: data.HeimMannschaft,
                                        foreignTeam: data.GastMannschaft,
                                        startDateTime,
                                        subLeague: data.Staffel,
                                        matchNumber: data.BegegnungNr,
                                        location,
                                        ageClass: data.Altersklasse,
                                        isCup,
                                        round: data.Runde,
                                        teamLead
                                    }));
                                } else {
                                    this.logger.info("Appointment ignored. It's marked with 'spielfrei' " + cleanedTermin)
                                }
                            } catch (err) {
                                this.logger.warning("Skipping row due to invalid date/time: " + cleanedTermin);
                            }
                        }

                        this.logger.info("Found " + appointments.size + " appointments in CSV file.");
                        resolve(appointments);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (err) => {
                    return reject(err);
                });
        })
    }
}
