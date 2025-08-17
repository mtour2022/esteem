class Company {
    constructor({
        company_id = "",
        userUID = "",
        address = {
            street: "",
            barangay: "",
            town: "",
            province: "",
            region: "",
            country: "",
        },
        classification = "",
        contact = "",
        email = "",
        logo = "",
        name = "",
        ownership = "",
        permit = "",
        proprietor = {
            first: "",
            middle: "",
            last: "",
        },
        status = "under review",
        status_history = [],
        tourism_certificate_ids = [],
        latest_cert_id = "",
        latest_cert_summary = {
            date_Expired: "",
            date_Issued: "",
            tourism_cert_id: "",
            type: ""
        },
        type = "",
        year = "",
        employee = [],
        ticket = [],
        password = "",
    }) {
        this.company_id = company_id;
        this.userUID = userUID;
        this.address = address;
        this.classification = classification;
        this.contact = contact;
        this.email = email;
        this.logo = logo;
        this.name = name;
        this.ownership = ownership;
        this.permit = permit;
        this.proprietor = proprietor;
        this.status = status;
        this.status_history = status_history;
        this.tourism_certificate_ids = tourism_certificate_ids;
        this.latest_cert_id = latest_cert_id;
        this.latest_cert_summary = latest_cert_summary;
        this.type = type;
        this.year = year;
        this.employee = employee;
        this.ticket = ticket;
        this.password = password;
    }

    // Method to get the full name of the proprietor
    getProprietorFullName() {
        return `${this.first} ${this.middle ? this.middle + " " : ""}${this.last}`;
    }

    // Method to get full address
    getFullAddress() {
        return `${this.street}, ${this.barangay}, ${this.town}, ${this.province}, ${this.region}, ${this.country}`;
    }

    // Method to check if the company is new
    isNewCompany() {
        return this.is_new;
    }

    toObject() {
        return { ...this };
    }
}

export default Company;
