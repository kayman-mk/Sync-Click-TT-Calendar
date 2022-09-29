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
            serverUrl: 'https://xxx/kayma/db66f6af-dca8-6395-a3b5-ec0fa69c99b9',
            credentials: {
                username: 'xxx',
                password: 'yyy',
            },
            authMethod: 'Basic',
            defaultAccountType: 'caldav'
        });
    }

    async downloadAppointments(): Promise<Set<Appointment>> {
        await this.client.login();

        const calendars = await this.client.fetchCalendars();
        this.logger.info(calendars);

        const calendarObjects = await this.client.fetchCalendarObjects({
            calendar: calendars[0],
        });

        this.logger.info(calendarObjects);
        return Promise.resolve(new Set<Appointment>());
    }

}