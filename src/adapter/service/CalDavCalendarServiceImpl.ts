const ICAL = require('ical.js');

import { v4 as uuidv4 } from 'uuid';
import { DateTimeFormatter, LocalDateTime, ZonedDateTime } from "@js-joda/core";
import { inject, injectable } from "inversify";
import { DAVCalendar, DAVClient } from "tsdav";
import { CONFIGURATION, SERVICE_IDENTIFIER } from "../../dependency_injection";
import { Appointment, AppointmentFactory } from "../../domain/model/appointment/Appointment";
import { CalendarService } from "../../domain/service/CalendarService";
import { Logger } from "../Logger";
import { exit } from 'process';

/**
 * Reads all events from a certain calendar. Events must be linked to category 'Click-TT'
 */
@injectable()
export class CalDavCalendarServiceImpl implements CalendarService {
    private client: DAVClient;

    constructor(@inject(CONFIGURATION.CalendarUrl) readonly url: string, @inject(CONFIGURATION.CalendarUsername) readonly username: string, @inject(CONFIGURATION.CalendarPassword) readonly password: string, @inject(SERVICE_IDENTIFIER.Logger) readonly logger: Logger) {
        this.client = new DAVClient({
            serverUrl: this.url,
            credentials: {
                username: this.username,
                password: this.password,
            },
            authMethod: 'Basic',
            defaultAccountType: 'caldav'
        });
    }

    private async findCalendar(urlToFind: string): Promise<DAVCalendar> {
        const calendars = await this.client.fetchCalendars();

        for (let index = 0; index < calendars.length; index++) {
            if (calendars[index].url == this.url) {
                return calendars[index];
            }
        }

        throw new Error("Calendar not found: " + this.url);
    }

    async downloadAppointments(minimumDateTime: ZonedDateTime, maximumDateTime: ZonedDateTime): Promise<Set<Appointment>> {
        await this.client.login();

        const calendar = await this.findCalendar(this.url);

        // const iso8601Formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssZ");
        const vEventDateTimeFormatters = [DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")];

        const calendarObjects = await this.client.fetchCalendarObjects({
            calendar: calendar,
            //            timeRange: {
            //                "start": startDateTime.format(iso8601Formatter),
            //                "end": endDateTime.format(iso8601Formatter)
            //            }
        });

        const result: Set<Appointment> = new Set();

        calendarObjects.forEach(calendarAppointment => {
            var vcalendar = new ICAL.Component(ICAL.parse(calendarAppointment.data));
            var vevent = vcalendar.getFirstSubcomponent('vevent');

            try {
                var startDateTime: LocalDateTime = LocalDateTime.of(2022, 12, 2);
                var startDateTimeFound = false;

                for (let index = 0; index < vEventDateTimeFormatters.length; index++) {
                    try {
                        startDateTime = LocalDateTime.parse(vevent.getFirstPropertyValue('dtstart').toString(), vEventDateTimeFormatters[index]);
                        startDateTimeFound = true;
                        break;
                    } catch (error) {
                        ;
                    }
                }

                if (!startDateTimeFound) {
                    throw Error("No parser defined for date/time: " + vevent.getFirstPropertyValue('dtstart'));
                }

                if (startDateTime.isAfter(minimumDateTime.toLocalDateTime().minusMonths(1)) && startDateTime.isBefore(maximumDateTime.toLocalDateTime().plusMonths(1))) {
                    var summary = vevent.getFirstPropertyValue('summary');

                    const lines: string[] = vevent.getFirstPropertyValue('description').toString().split("\n");
                    const id: string[] = lines.filter(line => line.startsWith('ID: '));
                    const categories: string[] = vevent.getAllProperties('categories').map((category: { getFirstValue: () => any; }) => category.getFirstValue());

                    if (id.length == 0) {
                        this.logger.warning("No ID found for calendar item '" + summary + "', " + startDateTime);
                    } else {
                        result.add(AppointmentFactory.createFromRaw(summary, startDateTime, id[0], vevent.getFirstPropertyValue('location'), categories));
                    }
                }
            } catch (error) {
                this.logger.debug(vevent);

                throw error;
            }
        });

        this.logger.info("Found " + result.size + " calendar entries.");

        return Promise.resolve(new Set<Appointment>(result));
    }

    async createAppointment(appointment: Appointment) {
        const calendar = await this.findCalendar(this.url);

        const ics = require('ics')

        const createPromise = new Promise((resolve, reject) => {
            ics.createEvent(this.appointmentToIcsEvent(appointment), (error: Error, value: string) => {
                if (error) {
                    this.logger.error(error);
                    reject(error);
                }

                return resolve(this.client.createCalendarObject({ calendar: calendar, iCalString: value, filename: uuidv4() + ".ics" }));
            });
        });

        console.log(await createPromise);
    }

    private appointmentToIcsEvent(appointment: Appointment) {
        const categories = ["Click-TT"];

        if (appointment.isCup) {
            categories.push('Pokal');
        } else {
            categories.push('Liga');
        }

        return {
            start: [appointment.startDateTime.year(), appointment.startDateTime.monthValue(), appointment.startDateTime.dayOfMonth(), appointment.startDateTime.hour(), appointment.startDateTime.minute()],
            duration: { hours: 2, minutes: 30 },
            title: appointment.title,
            description: appointment.id,
            location: appointment.location,
            categories: categories,
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
//            organizer: { name: 'xxx', email: 'yyy' },
            //            attendees: [
            //                { name: 'Adam Gibbons', email: 'adam@example.com', rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
            //                { name: 'Brittany Seaton', email: 'brittany@example2.org', dir: 'https://linkedin.com/in/brittanyseaton', role: 'OPT-PARTICIPANT' }
            //            ]
        }
    }
}