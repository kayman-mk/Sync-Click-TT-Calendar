import { ZoneId } from "@js-joda/core";
import '@js-joda/timezone';
import { inject, injectable } from "inversify";
import { LoggerImpl } from "../adapter/LoggerImpl";
import { SERVICE_IDENTIFIER } from "../dependency_injection";
import { Appointment, AppointmentInterface } from "../domain/model/Appointment";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";
import { CalendarService } from "../domain/service/CalendarService";
import { FileStorageService } from "../domain/service/FileStorageService";
import * as cheerio from "cheerio";
import { SportsHallRepository } from "../domain/service/SportsHallRepository";
import { Team } from "../domain/model/Team";
import {Club} from "../domain/model/Club";

@injectable()
export class SyncCalendarApplicationService {
    constructor(
        @inject(SERVICE_IDENTIFIER.AppointmentParserService) readonly appointmentParserService: AppointmentParserService,
        @inject(SERVICE_IDENTIFIER.CalendarService) readonly calendarService: CalendarService,
        @inject(SERVICE_IDENTIFIER.FileStorageService) readonly fileStorageService: FileStorageService,
        @inject(SERVICE_IDENTIFIER.Logger) readonly logger: LoggerImpl,
        @inject(SERVICE_IDENTIFIER.SportsHallRepository) readonly sportsHallRepository: SportsHallRepository
    ) { }

    async syncCalendarFromMyTischtennisWebpage(clubUrl: string) {
        this.logger.info(`Downloading webpage from: ${clubUrl}`);

        // Download the webpage
        //const response = await axios.get(clubUrl);
        //const html = response.data;
        const html = this.fileStorageService.readFile('spielplan.html');
        //this.fileStorageService.writeFile(`spielplan.html`, html);

        // Parse the HTML table using cheerio
        const $ = cheerio.load(html);
        const csvRows: string[] = [];

        // Add CSV header (matching Click-TT format)
        csvRows.push('Termin;Staffel;Runde;HeimMannschaft;HalleStrasse;HalleOrt;HallePLZ;HalleName;GastVereinName;GastMannschaft;BegegnungNr;Altersklasse');

        // Use the specific table selector for myTischtennis.de
        const table = $('table.w-full.caption-bottom');

        if (table.length === 0) {
            this.logger.error('Table not found on the webpage');
            throw new Error('Table not found on the webpage');
        }

        this.logger.info(`Found table, parsing rows...`);

        // Parse the table rows from tbody and collect row data for async processing
        const rowData: any[] = [];
        table.find('tbody tr').each((index, element) => {
            const cells = $(element).find('td');
            if (cells.length === 0) return; // Skip empty rows

            // Extract raw date and time from myTischtennis.de table
            const rawDate = $(cells[0]).text().trim();
            const rawTime = $(cells[1]).text().trim();
            if (rawDate == "Termin offen") return;

            const dateRegex = /(\d{2}\.\d{2}\.\d{4})/;
            const dateMatch = dateRegex.exec(rawDate);
            const date = dateMatch ? dateMatch[1] : rawDate;
            const month = parseInt(date.split('.')[1], 10);

            let time = rawTime;
            const timeRegex = /(\d{2}:\d{2})/;
            const timeMatch = timeRegex.exec(rawDate);
            if (timeMatch) {
                time = timeMatch[1];
            } else if (time && timeRegex.test(time)) {
                const rawTimeMatch = timeRegex.exec(time);
                time = rawTimeMatch ? rawTimeMatch[1] : time;
            } else {
                time = "00:00";
                this.logger.warning(`No valid time found for date ${date}, using default ${time}`);
            }
            const termin = `${date} ${time}`;

            const halleName = $(cells[2]).text().trim();
            const staffel = $(cells[3]).text().trim();
            // HeimMannschaft: extract <a> if present
            let heimMannschaft = $(cells[4]).text().trim();
            let team: Team | undefined = undefined;
            const heimMannschaftLink = $(cells[4]).find('a');
            if (heimMannschaftLink.length > 0) {
                heimMannschaft = heimMannschaftLink.text().trim();
                const href = heimMannschaftLink.attr('href');
                if (href) {
                    // If the link is relative, resolve it against the clubUrl
                    let resolvedUrl = href.startsWith('http') ? href : new URL(href, clubUrl).href;
                    // Remove the last path segment
                    try {
                        const urlObj = new URL(resolvedUrl);
                        urlObj.pathname = urlObj.pathname.replace(/\/?[^\/]+\/?$/, '/');
                        resolvedUrl = urlObj.toString().replace(/\/$/, ''); // Remove trailing slash
                    } catch {}
                    team = new Team(heimMannschaft, resolvedUrl);
                }
            }
            const gastMannschaft = $(cells[5]).text().trim();
            rowData.push({termin, halleName, staffel, heimMannschaft, gastMannschaft, month, team});
        });

        // Async process each row to fill address fields
        for (const row of rowData) {
            let halleStrasse = '', halleOrt = '', hallePLZ = '', halleNameFinal = row.halleName;
            let club: Club = { name: row.team?.getClubName(), url: row.team.url };
            if (row.heimMannschaft && row.halleName && club) {
                const hallNumMatch = row.halleName.match(/Spiellokal\s*(\d+)/);
                const sportshallNumber = hallNumMatch ? Number.parseInt(hallNumMatch[1], 10) : 1;
                const sportsHall = await this.sportsHallRepository.findByClubAndSportshall(club, sportshallNumber);
                if (sportsHall) {
                    halleStrasse = `${sportsHall.street} ${sportsHall.houseNumber}`.trim();
                    halleOrt = sportsHall.city;
                    hallePLZ = sportsHall.postalCode;
                    halleNameFinal = sportsHall.name;
                }
            }
            const runde = row.staffel.startsWith("KP") ? "Pokal" : (row.month >= 1 && row.month <= 4 ? "RR" : "VR" );
            const begegnungNr = `${row.heimMannschaft}-${row.gastMannschaft}-${row.staffel}-${runde}`;

            let altersklasse = '';
            if (row.staffel.endsWith("E")) {
                altersklasse = ""; // Erwachsene
            } else if (row.staffel.includes("mJ") || row.staffel.includes("wJ")) {
                if (row.staffel.includes("mJ")) {
                    altersklasse = row.staffel.substring(row.staffel.indexOf("mJ"));
                } else {
                    altersklasse = row.staffel.substring(row.staffel.indexOf("wJ"));
                }
            } else if (row.staffel.includes("J")) {
                altersklasse = row.staffel.substring(row.staffel.indexOf("J"));
            }

            const csvRow = `${row.termin};${row.staffel};${runde};${row.heimMannschaft};${halleStrasse};${halleOrt};${hallePLZ};${halleNameFinal};${row.gastMannschaft};${row.gastMannschaft};${begegnungNr};${altersklasse}`;
            csvRows.push(csvRow);
        }

        if (csvRows.length <= 1) {
            this.logger.error('No data rows found in the table');
            throw new Error('No data rows found in the table');
        }

        // Create temporary CSV file
        const tempCsvFilename = `temp-appointments-${Date.now()}.csv`;
        const csvContent = csvRows.join('\n');

        this.logger.info(`Writing CSV file: ${tempCsvFilename} with ${csvRows.length - 1} appointments`);
        this.fileStorageService.writeFile(tempCsvFilename, csvContent);

        try {
            // Call the existing CSV sync method
            await this.syncCalendarFromTtvnDownloadCsv(tempCsvFilename);

            this.logger.info(`Completed sync from myTischtennis webpage`);
        } finally {
            // Clean up temporary file
            this.logger.info(`Deleting temporary file: ${tempCsvFilename}`);
            this.fileStorageService.deleteFile(tempCsvFilename);
        }
    }

    async syncCalendarFromTtvnDownloadCsv(appointmentFilename: string) {
        // parsing ClickTT CSV file
        const appointmentsFromFile: Set<Appointment> = await this.appointmentParserService.parseAppointments(appointmentFilename);

        // read the calendar
        const appointmentsOrderedByTime = Array.from(appointmentsFromFile).sort((a, b) => a.startDateTime.compareTo(b.startDateTime));
        const calendarAppointments = await this.calendarService.downloadAppointments(appointmentsOrderedByTime[0].startDateTime.atZone(ZoneId.of("Europe/Berlin")), appointmentsOrderedByTime[appointmentsOrderedByTime.length - 1].startDateTime.atZone(ZoneId.of("Europe/Berlin")));

        // check, what to do
        const processedIds: Set<String> = new Set();
        const createAppointments: Appointment[] = [];
        const updateAppointments: Map<AppointmentInterface, AppointmentInterface> = new Map();

        appointmentsFromFile.forEach(appointmentFile => {
            const existingCalendarAppointment = this.isAppointmentInSet(calendarAppointments, appointmentFile.id);

            if (existingCalendarAppointment) {
                if (! existingCalendarAppointment.isSameAs(appointmentFile)) {
                    // appointment from file is present in calendar --> check for update
                    this.logger.info("update appointment in calendar");
                    updateAppointments.set(existingCalendarAppointment, appointmentFile);
                }
            } else {
                // appointment from file is missing in calendar --> create
                this.logger.info("create appointment in calendar");

                createAppointments.push(appointmentFile);
            }

            processedIds.add(appointmentFile.id);
        });

        calendarAppointments.forEach(appointmentCalendar => {
            if (!processedIds.has(appointmentCalendar.id)) {
                // calendar appointment not touched --> no longer in appointment file --> delete
                this.logger.info("appointment from calendar deleted");

                this.calendarService.deleteAppointment(appointmentCalendar);
            }
        });

        for (let index = 0; index < createAppointments.length; index++) {
            this.logger.info("Creating appointment in calendar: " + createAppointments[index].title + " at " + createAppointments[index].startDateTime);
            await this.calendarService.createAppointment(createAppointments[index]);
        }

        for (let entry of updateAppointments) {
            await this.calendarService.updateAppointment(entry[0], entry[1]);
        }
    }

    private isAppointmentInSet(appointments: Set<AppointmentInterface>, id: string): AppointmentInterface | undefined {
        for (const appointment of appointments.entries()) {
            if (appointment[0].id === id) {
                return appointment[0];
            }
        }
    }
}
