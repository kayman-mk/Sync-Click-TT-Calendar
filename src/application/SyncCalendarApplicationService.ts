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

            // Log first row to debug table structure
            if (index === 0) {
                this.logger.info(`First row cell count: ${cells.length}`);
                cells.each((i, cell) => {
                    this.logger.info(`Cell ${i}: "${$(cell).text().trim()}"`);
                });
            }

            // Extract raw date and time from myTischtennis.de table
            // The date format is "Mo., 25.08.2025" and time is typically in a separate cell or combined
            const rawDate = $(cells[0]).text().trim(); // e.g., "Mo., 25.08.2025"
            const rawTime = $(cells[1]).text().trim(); // e.g., "19:00" or might be part of cell 0

            // Parse date: remove day-of-week prefix (e.g., "Mo., " or "Di., ")
            // Date format from myTischtennis: "Mo., 25.08.2025" -> "25.08.2025"
            const dateRegex = /(\d{2}\.\d{2}\.\d{4})/;
            const dateMatch = dateRegex.exec(rawDate);
            const date = dateMatch ? dateMatch[1] : rawDate;

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

            // Log parsed date for first few rows to verify
            if (index < 3) {
                this.logger.info(`Row ${index}: rawDate="${rawDate}", rawTime="${rawTime}", parsed="${termin}"`);
            }

            // Map myTischtennis.de table structure to Click-TT CSV format
            // Based on observed structure: Date, Time, Round/Match#, League/Team info, Team/Venue info, Score
            // myTischtennis.de typically has: Date | Time | League/Group | Home Team | Guest Team | Venue | ...
            // But structure may vary, so we'll extract what's available

            // Try to extract available fields with fallbacks
            const runde = $(cells[2]).text().trim() || "VR"; // Round - default to VR if not available
            const staffelOrTeam = $(cells[3]).text().trim(); // Could be Staffel or team name
            const team1 = $(cells[4]).text().trim(); // Could be home team or venue
            const team2 = $(cells[5]).text().trim(); // Could be guest team or venue
            const venueOrScore = $(cells[6]).text().trim(); // Could be venue or score

            // Heuristic: if cell 6 looks like a score (e.g., "2:6"), swap interpretations
            const isScore = /^\d+:\d+$/.test(venueOrScore);

            let staffel, heimMannschaft, gastVereinName, gastMannschaft, halleName;

            if (isScore) {
                // Past match format: Round | Staffel | Home | Guest | Score
                staffel = staffelOrTeam;
                heimMannschaft = team1;
                gastVereinName = team2;
                gastMannschaft = team2; // Use same as GastVereinName if not separately available
                halleName = "";
            } else {
                // Future match format or different layout
                staffel = staffelOrTeam;
                heimMannschaft = team1;
                gastVereinName = team2;
                gastMannschaft = team2;
                halleName = venueOrScore;
            }

            // Extract additional fields if available
            const halleStrasse = $(cells[7]).text().trim();
            const halleOrt = $(cells[8]).text().trim();
            const hallePLZ = $(cells[9]).text().trim();
            const begegnungNr = $(cells[10]).text().trim() || "1";
            const altersklasse = $(cells[11]).text().trim() || "";

            // Build CSV row
            const csvRow = `${termin};${staffel};${runde};${heimMannschaft};${halleStrasse};${halleOrt};${hallePLZ};${halleName};${gastVereinName};${gastMannschaft};${begegnungNr};${altersklasse}`;
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

        // Call the existing CSV sync method
        await this.syncCalendarFromTtvnDownloadCsv(tempCsvFilename);

        this.logger.info(`Completed sync from myTischtennis webpage`);
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
                this.logger.info("delete appointment from calendar");

                this.calendarService.deleteAppointment(appointmentCalendar);
            }
        });

        for (let index = 0; index < createAppointments.length; index++) {
            await this.calendarService.createAppointment(createAppointments[index]);
        }

        for (let entry of updateAppointments) {
            await this.calendarService.updateAppointment(entry[0], entry[1]);
        }
    }

    private isAppointmentInSet(appointments: Set<AppointmentInterface>, id: string): AppointmentInterface | undefined {
        let result: Appointment;

        for (const appointment of appointments.entries()) {
            if (appointment[0].id === id) {
                return appointment[0];
            }
        }
    }
}
