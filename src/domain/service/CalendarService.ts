import { ZonedDateTime } from "@js-joda/core";
import { Appointment } from "../model/appointment/Appointment";

export interface CalendarService {
    downloadAppointments(startDateTime: ZonedDateTime, endDateTime: ZonedDateTime): Promise<Set<Appointment>>;
}