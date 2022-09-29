import { DateTimeFormatter, ZonedDateTime } from "@js-joda/core";
import { inject, injectable } from "inversify";
import { DAVClient } from "tsdav";
import { CONFIGURATION, SERVICE_IDENTIFIER } from "../../dependency_injection";
import { Appointment } from "../../domain/model/appointment/Appointment";
import { CalendarService } from "../../domain/service/CalendarService";
import { Logger } from "../Logger";

@injectable()
export class CalDavCalendarServiceImpl implements CalendarService {
    private client: DAVClient;

    constructor(@inject(CONFIGURATION.CalendarUrl) readonly url: string, @inject(CONFIGURATION.CalendarUsername) readonly username: string, @inject(CONFIGURATION.CalendarPassword) readonly password: string, @inject(SERVICE_IDENTIFIER.Logger) readonly logger: Logger) {
        this.client = new DAVClient({
            serverUrl: 'zzzz',
            credentials: {
                username: 'xxxx',
                password: 'yyyy',
            },
            authMethod: 'Basic',
            defaultAccountType: 'caldav'
        });
    }

    async downloadAppointments(startDateTime: ZonedDateTime, endDateTime: ZonedDateTime): Promise<Set<Appointment>> {
        await this.client.login();

        const calendars = await this.client.fetchCalendars();

        const iso8601Formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssZ");
        console.log(startDateTime.format(iso8601Formatter));
        const calendarObjects = await this.client.fetchCalendarObjects({
            calendar: calendars[0],
            timeRange: {
                "start": startDateTime.format(iso8601Formatter),
                "end": endDateTime.format(iso8601Formatter)
            }
        });

        this.logger.info(calendarObjects);
        return Promise.resolve(new Set<Appointment>());
    }
}