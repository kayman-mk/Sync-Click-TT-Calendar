import { Appointment } from "../../../domain/model/appointment/Appointment";
import { ClickTTService } from "../../../domain/service/ClickTTService";
import { Configuration } from "../../Configuration";

export class ClickTTServiceImpl implements ClickTTService {
    constructor(configuration: Configuration) { }

    downloadAppointments(): Set<Appointment> {
        throw new Error("Method not implemented.");
    }

}