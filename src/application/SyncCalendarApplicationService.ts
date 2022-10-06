import { DateTimeFormatter, ZoneId } from "@js-joda/core";
import '@js-joda/timezone';
import { inject, injectable } from "inversify";
import { exit } from "process";
import { Logger } from "../adapter/Logger";
import { SERVICE_IDENTIFIER } from "../dependency_injection";
import { Appointment, AppointmentInterface } from "../domain/model/appointment/Appointment";
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
                this.logger.info("delete appointment");
              //  this.calendarService.deleteAppointment(appointmentCalendar);
            }
        });

        for (let index = 0; index < createAppointments.length; index++) {
            this.logger.info("create new appointment");
            //await this.calendarService.createAppointment(createAppointments[index]);
        }

        for (let entry of updateAppointments) {
            this.logger.info("update appointment");
            //await this.calendarService.updateAppointment(entry[0], entry[1]);
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