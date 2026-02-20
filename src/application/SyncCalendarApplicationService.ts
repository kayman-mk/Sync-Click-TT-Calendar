import { ZoneId } from "@js-joda/core";
import '@js-joda/timezone';
import { inject, injectable } from "inversify";
import { LoggerImpl } from "../adapter/LoggerImpl";
import { SERVICE_IDENTIFIER } from "../dependency_injection";
import { Appointment, AppointmentInterface } from "../domain/model/appointment/Appointment";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";
import { CalendarService } from "../domain/service/CalendarService";
import { FileStorageService } from "../domain/service/FileStorageService";
import axios from "axios";
import * as cheerio from "cheerio";

@injectable()
export class SyncCalendarApplicationService {
    constructor(
        @inject(SERVICE_IDENTIFIER.AppointmentParserService) readonly appointmentParserService: AppointmentParserService,
        @inject(SERVICE_IDENTIFIER.CalendarService) readonly calendarService: CalendarService,
        @inject(SERVICE_IDENTIFIER.FileStorageService) readonly fileStorageService: FileStorageService,
        @inject(SERVICE_IDENTIFIER.Logger) readonly logger: LoggerImpl
    ) { }

    async syncCalendarFromMyTischtennisWebpage(clubUrl: string) {
        this.logger.info(`Downloading webpage from: ${clubUrl}`);

        // Download the webpage
        const response = await axios.get(clubUrl);
        const html = response.data;

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

        // Parse the table rows from tbody
        table.find('tbody tr').each((index, element) => {
            const cells = $(element).find('td');
            if (cells.length === 0) return; // Skip empty rows

            // Extract raw date and time from myTischtennis.de table
            // The date format is "Mo., 25.08.2025" and time is typically in a separate cell or combined
            const rawDate = $(cells[0]).text().trim(); // e.g., "Mo., 25.08.2025"
            const rawTime = $(cells[1]).text().trim(); // e.g., "19:00" or might be part of cell 0

            if (rawDate == "Termin offen") return; // Skip rows with open date

            // Parse date: remove day-of-week prefix (e.g., "Mo., " or "Di., ")
            // Date format from myTischtennis: "Mo., 25.08.2025" -> "25.08.2025"
            const dateRegex = /(\d{2}\.\d{2}\.\d{4})/;
            const dateMatch = dateRegex.exec(rawDate);
            const date = dateMatch ? dateMatch[1] : rawDate;
            const month = parseInt(date.split('.')[1], 10);

            // Try to extract time if it's in the date cell or use the second cell
            // Note: Trailing "v" means the appointment was moved (verlegt in German)
            let time = rawTime;
            const timeRegex = /(\d{2}:\d{2})/;
            const timeMatch = timeRegex.exec(rawDate);
            if (timeMatch) {
                time = timeMatch[1];
            } else if (time && timeRegex.test(time)) {
                // Extract just the time part, removing any trailing characters like "v" (moved appointment)
                const rawTimeMatch = timeRegex.exec(time);
                time = rawTimeMatch ? rawTimeMatch[1] : time;
            } else {
                // Default time if not found
                time = "00:00";
                this.logger.warning(`No valid time found for date ${date}, using default ${time}`);
            }

            // Combine date and time in the format expected by CSV parser: "dd.MM.yyyy HH:mm"
            const termin = `${date} ${time}`;

            // Map myTischtennis.de table structure to Click-TT CSV format
            // Based on observed structure: Date, Time, Round/Match#, League/Team info, Team/Venue info, Score
            // myTischtennis.de typically has: Date | Time | League/Group | Home Team | Guest Team | Venue | ...
            // But structure may vary, so we'll extract what's available

            // Try to extract available fields with fallbacks
            const halleName = $(cells[2]).text().trim(); // Halle
            const staffel = $(cells[3]).text().trim(); // Could be Staffel or team name
            const heimMannschaft = $(cells[4]).text().trim(); // Could be home team
            const gastMannschaft = $(cells[5]).text().trim(); // Could be guest

            // Build CSV row
            const halleStrasse = ''; // Not available in myTischtennis.de table, could be extracted from venue info if available
            const halleOrt = '';
            const hallePLZ = '';
            // Determine round type based on calendar month:
            // In the German table tennis season, the Vorrunde (VR, first half of the season) is played in the
            // second half of the calendar year, and the Rückrunde (RR, second half of the season) is played
            // in the first months of the following year. Therefore, matches in months 1–4 (Jan–Apr) belong
            // to the RR, all other months map to VR. Pokal (cup) matches are marked separately via "KP".
            const runde = staffel.startsWith("KP") ? "Pokal" : (month >= 1 && month <= 4 ? "RR" : "VR" );
            const begegnungNr = `${heimMannschaft}-${gastMannschaft}-${staffel}-${runde}`;

            let altersklasse = '';
            if (staffel.endsWith("E")) {
                altersklasse = ""; // Erwachsene
            } else if (staffel.includes("mJ") || staffel.includes("wJ")) {
                // extract from mJ to the end
                if (staffel.includes("mJ")) {
                    altersklasse = staffel.substring(staffel.indexOf("mJ"));
                } else {
                    altersklasse = staffel.substring(staffel.indexOf("wJ"));
                }
            } else if (staffel.includes("J")) {
                altersklasse = staffel.substring(staffel.indexOf("J"));
            }

            const csvRow = `${termin};${staffel};${runde};${heimMannschaft};${halleStrasse};${halleOrt};${hallePLZ};${halleName};${gastMannschaft};${gastMannschaft};${begegnungNr};${altersklasse}`;
            csvRows.push(csvRow);
        });

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
