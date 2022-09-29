import { inject, injectable } from "inversify";
import { SERVICE_IDENTIFIER } from "../dependency_injection";
import { Appointment } from "../domain/model/appointment/Appointment";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";
import { CalendarService } from "../domain/service/CalendarService";

@injectable()
export class SyncCalendarApplicationService {
    constructor(@inject(SERVICE_IDENTIFIER.AppointmentParserService) readonly appointmentParserService: AppointmentParserService, @inject(SERVICE_IDENTIFIER.CalendarService) readonly calendarService: CalendarService) {}

    async syncCalendar(appointmentFilename: string) {
        // parsing ClickTT CSV file
        const appointments: Set<Appointment> = await this.appointmentParserService.parseAppointments(appointmentFilename);

        // for each calendar item --> check against Click-TT appointment and do the action
        await this.calendarService.downloadAppointments();

        // for all unprocessed Click-TT items: create them (missing in calendar)
    }
}