import { injectable } from "inversify";
import { Appointment } from "../model/appointment/Appointment";

export interface AppointmentParserService {
    parseAppointments(): Promise<Set<Appointment>>;
}