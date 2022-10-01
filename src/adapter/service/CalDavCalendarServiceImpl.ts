const ICAL = require('ical.js');

import { DateTimeFormatter, LocalDateTime, ZonedDateTime } from "@js-joda/core";
import { inject, injectable } from "inversify";
import { DAVClient } from "tsdav";
import { CONFIGURATION, SERVICE_IDENTIFIER } from "../../dependency_injection";
import { Appointment, AppointmentFactory } from "../../domain/model/appointment/Appointment";
import { CalendarService } from "../../domain/service/CalendarService";
import { Logger } from "../Logger";

/**
 * Reads all events from a certain calendar. Events must be linked to category 'Click-TT'
 */
@injectable()
export class CalDavCalendarServiceImpl implements CalendarService {
    private client: DAVClient;

    constructor(@inject(CONFIGURATION.CalendarUrl) readonly url: string, @inject(CONFIGURATION.CalendarUsername) readonly username: string, @inject(CONFIGURATION.CalendarPassword) readonly password: string, @inject(SERVICE_IDENTIFIER.Logger) readonly logger: Logger) {
        this.client = new DAVClient({
            serverUrl: '',
            credentials: {
                username: '',
                password: '',
            },
            authMethod: 'Basic',
            defaultAccountType: 'caldav'
        });
    }

    async downloadAppointments(minimumDateTime: ZonedDateTime, maximumDateTime: ZonedDateTime): Promise<Set<Appointment>> {
        await this.client.login();

        const calendars = await this.client.fetchCalendars();

        // const iso8601Formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssZ");
        const vEventDateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

        const calendarObjects = await this.client.fetchCalendarObjects({
            calendar: calendars[4],
            //            timeRange: {
            //                "start": startDateTime.format(iso8601Formatter),
            //                "end": endDateTime.format(iso8601Formatter)
            //            }
        });

        const result: Set<Appointment> = new Set();

        calendarObjects.forEach(calendarAppointment => {
            var vcalendar = new ICAL.Component(ICAL.parse(calendarAppointment.data));
            var vevent = vcalendar.getFirstSubcomponent('vevent');

            var startDateTime = LocalDateTime.parse(vevent.getFirstPropertyValue('dtstart').toString(), vEventDateTimeFormatter);
            if (startDateTime.isAfter(minimumDateTime.toLocalDateTime()) && startDateTime.isBefore(maximumDateTime.toLocalDateTime())) {
                var summary = vevent.getFirstPropertyValue('summary');
                console.log(calendarAppointment.data);

                const lines: string[] = vevent.getFirstPropertyValue('description').toString().split("\n");
                const id: string[] = lines.filter(line => line.startsWith('ID: '));

                result.add(AppointmentFactory.createFromRaw(summary, startDateTime, id?[0].substring(4)));
            }
        });

        this.logger.info("Found " + result.size + " calendar entries.");

        return Promise.resolve(new Set<Appointment>(result));
    }
}