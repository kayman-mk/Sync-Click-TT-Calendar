import { Appointment } from "../model/appointment/Appointment";

export interface CalendarService {
    downloadAppointments(): Promise<Set<Appointment>>;
}