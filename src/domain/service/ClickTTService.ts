import { Appointment } from "../model/appointment/Appointment";

export interface ClickTTService {
    downloadAppointments(): Set<Appointment>;
}