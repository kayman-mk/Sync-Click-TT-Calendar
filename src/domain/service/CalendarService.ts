import { ZonedDateTime } from "@js-joda/core";
import { Appointment, AppointmentInterface } from "../model/Appointment";

export interface CalendarService {
    createAppointment(appointment: Appointment): void;
    updateAppointment(existingAppointment: AppointmentInterface, newData: AppointmentInterface): void;
    deleteAppointment(existingAppointment: AppointmentInterface): void;

    downloadAppointments(startDateTime: ZonedDateTime, endDateTime: ZonedDateTime): Promise<Set<AppointmentInterface>>;
}
