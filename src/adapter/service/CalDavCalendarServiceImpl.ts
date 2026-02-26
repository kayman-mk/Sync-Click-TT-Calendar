const ICAL = require('ical.js');
require('@js-joda/timezone');

import { v4 as uuidv4 } from 'uuid';
import { DateTimeFormatter, LocalDateTime, ZonedDateTime, ZoneId } from "@js-joda/core";
import { inject, injectable } from "inversify";
import { DAVCalendar, DAVCalendarObject, DAVClient } from "tsdav";
import { CONFIGURATION, SERVICE_IDENTIFIER } from "../../dependency_injection";
import { Appointment, AppointmentFactory, AppointmentInterface } from "../../domain/model/Appointment";
import { CalendarService } from "../../domain/service/CalendarService";
import { TeamLeadRepository } from "../../domain/service/TeamLeadRepository";
import { TeamLead } from "../../domain/model/TeamLead";
import { Logger } from "../../domain/service/Logger";

/**
 * Reads all events from a certain calendar. Events must be linked to category 'Click-TT'
 */
@injectable()
export class CalDavCalendarServiceImpl implements CalendarService {
    private readonly client: DAVClient;
    private readonly logger: Logger;
    private readonly teamLeadRepository: TeamLeadRepository;
    private calendar: DAVCalendar | undefined;

    constructor(@inject(CONFIGURATION.CalendarUrl) readonly url: string, @inject(CONFIGURATION.CalendarUsername) readonly username: string, @inject(CONFIGURATION.CalendarPassword) readonly password: string, @inject(SERVICE_IDENTIFIER.Logger) logger: Logger, @inject(SERVICE_IDENTIFIER.TeamLeadRepository) teamLeadRepository: TeamLeadRepository) {
        this.client = new DAVClient({
            serverUrl: this.url,
            credentials: {
                username: this.username,
                password: this.password,
            },
            authMethod: 'Basic',
            defaultAccountType: 'caldav'
        });

        this.logger = logger;
        this.teamLeadRepository = teamLeadRepository;
    }

    private async findCalendar(urlToFind: string): Promise<DAVCalendar> {
        const calendars = await this.client.fetchCalendars();

        this.logger.debug(`Looking for calendar with URL: ${urlToFind}`);
        this.logger.debug(`Found ${calendars.length} calendars`);

        for (let index = 0; index < calendars.length; index++) {
            this.logger.debug(`Calendar ${index}: ${calendars[index].url} (displayName: ${calendars[index].displayName})`);

            // Check if the calendar URL matches exactly or if the urlToFind is contained in the calendar URL
            if (calendars[index].url === urlToFind || calendars[index].url?.includes(urlToFind)) {
                this.logger.info(`Found matching calendar: ${calendars[index].displayName} (${calendars[index].url})`);
                return calendars[index];
            }
        }

        // If no match found, log all available calendars to help with debugging
        this.logger.error(`Calendar not found. Available calendars:`);
        calendars.forEach((cal, idx) => {
            this.logger.error(`  [${idx}] ${cal.displayName}: ${cal.url}`);
        });

        throw new Error(`Calendar not found: ${urlToFind}. Found ${calendars.length} calendar(s). Check the calendar URL parameter.`);
    }

    async downloadAppointments(minimumDateTime: ZonedDateTime, maximumDateTime: ZonedDateTime): Promise<Set<AppointmentInterface>> {
        await this.client.login();

        this.calendar = await this.findCalendar(this.url);

        const vEventDateTimeFormatters = [
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
            DateTimeFormatter.ISO_ZONED_DATE_TIME
        ];

        const calendarObjects = await this.client.fetchCalendarObjects({
            calendar: this.calendar,
            //            timeRange: {
            //                "start": startDateTime.format(iso8601Formatter),
            //                "end": endDateTime.format(iso8601Formatter)
            //            }
        });

        const result: Set<AppointmentInterface> = new Set();

        for (const calendarAppointment of calendarObjects) {
            let vcalendar = new ICAL.Component(ICAL.parse(calendarAppointment.data));
            let vevent = vcalendar.getFirstSubcomponent('vevent');

            try {
                let startDateTime: LocalDateTime = LocalDateTime.of(2022, 12, 2);
                let startDateTimeFound = false;

                for (const element of vEventDateTimeFormatters) {
                    try {
                        const zoneDateTime = ZonedDateTime.parse(vevent.getFirstPropertyValue('dtstart').toString(), element);
                        startDateTime = zoneDateTime.withZoneSameInstant(ZoneId.of('Europe/Berlin')).toLocalDateTime()
                        startDateTimeFound = true;

                        break;
                    } catch (error) { // NOSONAR - we want to try all formatters until one works, so we catch and ignore the error here
                    }
                }

                if (!startDateTimeFound) {
                    startDateTime = LocalDateTime.parse(vevent.getFirstPropertyValue('dtstart').toString());
                    startDateTimeFound = true;
                }

                if (!startDateTimeFound) {
                    this.logger.error("No parser defined for date/time: (" + vevent.getFirstPropertyValue('dtstart') + ")");
                }

                if (startDateTimeFound && startDateTime.isAfter(minimumDateTime.toLocalDateTime().minusMonths(1)) && startDateTime.isBefore(maximumDateTime.toLocalDateTime().plusMonths(1))) {
                    const summary = vevent.getFirstPropertyValue('summary');
                    const categories: string[] = vevent.getAllProperties('categories').map((category: { getFirstValue: () => any; }) => category.getFirstValue());

                    if (Appointment.isFromClickTT(categories)) {
                        // read the team lead from the organizer property if available. use the repository to find the team lead by name
                        let teamLead: TeamLead | undefined = undefined;
                        const organizer = vevent.getFirstPropertyValue('organizer');
                        if (organizer) {
                            // add email to model. this is the mail address prefixed with "mailto:" in the organizer property. we can use this to uniquely identify the team lead, as the name might not be unique
                            const organizerName = organizer.replace(/.*CN=([^;]+).*/, '$1'); // Extract the common name (CN) from the organizer string
                            this.logger.debug(`Found organizer in calendar event: ${organizerName}`);

                            try {
                                // Determine runde from the appointment date
                                const runde = Appointment.getRunde(startDateTime);
                                teamLead = await this.teamLeadRepository.findByName(organizerName, runde);
                                if (teamLead) {
                                    this.logger.debug(`Matched organizer to team lead: ${teamLead.fullName}`);
                                } else {
                                    this.logger.debug(`No team lead found matching organizer name: ${organizerName}`);
                                    // Create a default team lead with the organizer name
                                    teamLead = new TeamLead(organizerName, "", "", "", "");
                                }
                            } catch (error) {
                                this.logger.error(`Error looking up team lead for organizer "${organizerName}": ${error}`);
                                // Create a default team lead on error
                                teamLead = new TeamLead(organizer, "", "", "", "");
                            }
                        } else {
                            // Create a default team lead when no organizer is present
                            teamLead = new TeamLead("Unknown", "", "", "", "");
                        }

                        const appointmentFromCalendar = new DAVAppointmentDecorator(AppointmentFactory.createFromCalendar(summary, startDateTime, vevent.getFirstPropertyValue('description'), vevent.getFirstPropertyValue('location'), categories, teamLead), calendarAppointment);

                        result.add(appointmentFromCalendar);
                    } else {
                        this.logger.warning("Appointment in calendar ignored. Manually created? No Click-TT ID found:  '" + summary + "', " + startDateTime + ", " + categories);
                    }
                }
            } catch (error) {
                this.logger.debug(vevent);

                throw error;
            }
        }

        this.logger.info("Found " + result.size + " calendar entries.");

        return Promise.resolve(new Set<AppointmentInterface>(result));
    }

    async createAppointment(appointment: Appointment) {
        const ics = require('ics')

        // Ensure the calendar is initialized before creating an appointment
        if (!this.calendar) {
            await this.client.login();
            this.calendar = await this.findCalendar(this.url);
        }
        const createPromise = new Promise(async (resolve, reject) => {
            const icsEvent = await this.appointmentToIcsEvent(appointment);
            ics.createEvent(icsEvent, (error: Error, value: string) => {
                if (error) {
                    this.logger.error(error);
                    reject(error);
                }

                return resolve(
                    this.client.createCalendarObject({
                        calendar: this.calendar as DAVCalendar,
                        iCalString: value,
                        filename: uuidv4() + ".ics",
                    })
                );
            });
        });

        this.logger.debug(appointment.toString());
        await createPromise;
    }

    async updateAppointment(existingAppointment: AppointmentInterface, newData: AppointmentInterface): Promise<void> {
        if (existingAppointment instanceof DAVAppointmentDecorator) {
            var vcalendar = new ICAL.Component(ICAL.parse(existingAppointment.calendarObject.data));
            var vevent = vcalendar.getFirstSubcomponent('vevent');

            const iso8601Formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

            vevent.updatePropertyWithValue('location', newData.location);

            vevent.removeAllProperties('categories');
            newData.categories.forEach(category => {
                var prop = new ICAL.Property('categories');
                prop.setValue(category);

                vevent.addProperty(prop);
            });

            vevent.updatePropertyWithValue('title', newData.title);
            vevent.updatePropertyWithValue('description', newData.description);
            vevent.updatePropertyWithValue('organizer', {name: newData.teamLead.fullName, email: newData.teamLead.email});

            vevent.updatePropertyWithValue('dtstart', iso8601Formatter.format(newData.startDateTime));

            existingAppointment.calendarObject.data = vcalendar.toString();
            this.logger.debug(newData.toString());
            await this.client.updateCalendarObject({ calendarObject: existingAppointment.calendarObject });
        } else {
            throw new Error("Update works for calendar objects only!");
        }
    }

    async deleteAppointment(existingAppointment: AppointmentInterface): Promise<void> {
        if (existingAppointment instanceof DAVAppointmentDecorator) {
            this.logger.debug(existingAppointment.toString());
            await this.client.deleteCalendarObject({ calendarObject: existingAppointment.calendarObject });
        } else {
            throw new Error("Delete works for calendar objects only!");
        }
    }

    private async appointmentToIcsEvent(appointment: Appointment) {
        const icsEvent: any = {
            start: [appointment.startDateTime.year(), appointment.startDateTime.monthValue(), appointment.startDateTime.dayOfMonth(), appointment.startDateTime.hour(), appointment.startDateTime.minute()],
            duration: { hours: 2, minutes: 30 },
            title: appointment.title,
            description: appointment.description,
            location: appointment.location,
            categories: appointment.categories,
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
        };

        // Use the team lead from the appointment if available
        if (appointment.teamLead) {
            icsEvent.organizer = { name: appointment.teamLead.fullName, email: appointment.teamLead.email };
            this.logger.debug(`Using team lead as organizer: ${icsEvent.organizer}`);
        } else {
            this.logger.debug(`No team lead available for appointment: ${appointment.title}`);
        }

        return icsEvent;
    }
}

/**
 * Decorates the appointment with a calendar object. This way we can update the calendar later.
 */
class DAVAppointmentDecorator implements AppointmentInterface {
    constructor(readonly decoratedAppointment: AppointmentInterface, readonly calendarObject: DAVCalendarObject) {
    }

    get subLeague(): string {
        return this.decoratedAppointment.subLeague;
    }

    get matchNumber(): number {
        return this.decoratedAppointment.matchNumber;
    }

    get round(): string {
        return this.decoratedAppointment.round;
    }

    get description(): string {
        return this.decoratedAppointment.description;
    }

    get isCup(): boolean {
        return this.decoratedAppointment.isCup
    }

    get ageClass(): string {
        return this.decoratedAppointment.ageClass
    }

    get title(): string {
        return this.decoratedAppointment.title;
    }

    get startDateTime(): LocalDateTime {
        return this.decoratedAppointment.startDateTime;
    }

    get categories(): string[] {
        return this.decoratedAppointment.categories;
    }

    get id(): string {
        return this.decoratedAppointment.id;
    }

    get location(): string {
        return this.decoratedAppointment.location;
    }

    get teamLead() {
        return this.decoratedAppointment.teamLead;
    }

    isSameAs(compareTo: Appointment): boolean {
        return this.decoratedAppointment.isSameAs(compareTo);
    }
}
