import { ZonedDateTime } from "@js-joda/core";
import { Appointment } from "../model/appointment/Appointment";

export interface CalendarService {
    createAppointment(appointment: Appointment): void;
    downloadAppointments(startDateTime: ZonedDateTime, endDateTime: ZonedDateTime): Promise<Set<Appointment>>;
}