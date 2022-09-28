import { Appointment } from "../model/appointment/Appointment";

export interface CalendarService {
    downloadAppointments(): Set<Appointment>;
}