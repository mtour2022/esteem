import { ActivityModel } from "./activities";

class TicketModel {
    constructor({
        company_id = "",
        userUID = "",
        ticket_id = "",
        start_date_time = "",
        end_date_time = "",
        is_same_date = "",
        name = "",
        contact = "",
        accommodation = "",
        isSingleGroup = "",
        isMixedGroup = "",
        address = [
            {
                street: "",
                barangay: "",
                town: "",
                province: "",
                region: "",
                country: "",
                locals: "",
                foreigns: "",
                males: "",
                females: "",
                prefer_not_to_say: "",
                kids: "",
                teens: "",
                seniors: "",
                adults: "",
            },
        ],
        total_pax = "",
        total_duration = "",
        activities = [
            {
                activity_area: "",
                activity_date_time_start: "",
                activity_date_time_end: "",
                activities_availed: [new ActivityModel()],
                activity_num_unit: "",
                activity_num_pax: "",
                activity_subtotal: "",
            }
        ],
        total_expected_payment = "",
        total_payment = "",
        remarks = "",
        status = "",
        status_history = [],
        employee = [],
        ticket = [],
        password = "",
    } = {}) { // make sure to default to {} to avoid "undefined" constructor param

        this.company_id = company_id;
        this.userUID = userUID;
        this.ticket_id = ticket_id;
        this.start_date_time = start_date_time;
        this.end_date_time = end_date_time;
        this.is_same_date = is_same_date;
        this.name = name;
        this.contact = contact;
        this.accommodation = accommodation;
        this.isSingleGroup = isSingleGroup;
        this.isMixedGroup = isMixedGroup;
        this.address = address;
        this.activities = activities;
                this.total_payment = total_payment;

        this.status = status;
        this.status_history = status_history;
        this.employee = employee;
        this.ticket = ticket;
        this.password = password;
    }

    getProprietorFullName() {
        return `${this.first} ${this.middle ? this.middle + " " : ""}${this.last}`;
    }

    getFullAddress() {
        return `${this.street}, ${this.barangay}, ${this.town}, ${this.province}, ${this.region}, ${this.country}`;
    }

    isNewCompany() {
        return this.is_new;
    }

    toObject() {
        return { ...this };
    }
}

export default TicketModel;
