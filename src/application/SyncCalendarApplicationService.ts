import { DateTimeFormatter, ZoneId } from "@js-joda/core";
import '@js-joda/timezone';
import { inject, injectable } from "inversify";
import { Logger } from "../adapter/Logger";
import { SERVICE_IDENTIFIER } from "../dependency_injection";
import { Appointment } from "../domain/model/appointment/Appointment";
import { AppointmentParserService } from "../domain/service/AppointmentParserService";
import { CalendarService } from "../domain/service/CalendarService";

@injectable()
export class SyncCalendarApplicationService {
    constructor(@inject(SERVICE_IDENTIFIER.AppointmentParserService) readonly appointmentParserService: AppointmentParserService, @inject(SERVICE_IDENTIFIER.CalendarService) readonly calendarService: CalendarService,
        @inject(SERVICE_IDENTIFIER.Logger) readonly logger: Logger) { }

    async syncCalendar(appointmentFilename: string) {
        // parsing ClickTT CSV file
        const appointmentsFromFile: Set<Appointment> = await this.appointmentParserService.parseAppointments(appointmentFilename);

        // read the calendar
        const appointmentsOrderedByTime = Array.from(appointmentsFromFile).sort((a, b) => a.startDateTime.compareTo(b.startDateTime));
        const calendarAppointments = await this.calendarService.downloadAppointments(appointmentsOrderedByTime[0].startDateTime.atZone(ZoneId.of("Europe/Berlin")), appointmentsOrderedByTime[appointmentsOrderedByTime.length - 1].startDateTime.atZone(ZoneId.of("Europe/Berlin")));

        // check, what to do
        const processedIds: Set<String> = new Set();
const createAppointments: Appointment[] = [];

        appointmentsFromFile.forEach(appointmentFile => {
            if (this.isAppointmentInSet(calendarAppointments, appointmentFile.id)) {
                // appointment from file is present in calendar --> check for update
                this.logger.info("update appointment in calendar");
            } else {
                // appointment from file is missing in calendar --> create
                createAppointments.push(appointmentFile);
            }

            processedIds.add(appointmentFile.id);
        });

        calendarAppointments.forEach(appointmentCalendar => {
            if (!processedIds.has(appointmentCalendar.id)) {
                // calendar appointment not touched --> no longer in appointment file --> delete
                this.logger.info("delete appointment from calendar");
            }
        });

        for (let index = 0; index < createAppointments.length; index++) {
            await this.calendarService.createAppointment(createAppointments[index]);
        }
    }

    private isAppointmentInSet(appointments: Set<Appointment>, id: string) {
        let result = false;

        appointments.forEach(appointment => {
            if (appointment.id === id) {
                result = true;
            }
        });

        return result;
    }
}