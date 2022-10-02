import {Appointment, AppointmentFactory} from "../../../../src/domain/model/appointment/Appointment";

describe('Appointment Factory', () => {
    it('should have a title equal to "local - foreign" team name', () => {
        // when
        const actualAppointment: Appointment = AppointmentFactory.create('local', 'remote', '01.01.1970 00:00', '3. KK West', 5, 'location');

        // then
        expect(actualAppointment.title).toEqual("local - remote");
    })

    it('should parse the start date time', () => {
        // when
        const actualAppointment: Appointment = AppointmentFactory.create('local', 'remote', '01.01.1970 00:00', '3. KK West', 7, 'location');

        // then
        expect(actualAppointment.startDateTime.toString()).toEqual('1970-01-01T00:00');
    })
})