class Company {
    constructor({
        company_id = "",
        address = {
            street: "",
            barangay: "",
            town: "",
            province: "",
            region: "",
            country: "",
            zip: "",
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
        status = "",
        type = "",
        year = "",
        employee = 0,
        ticket = 0
    }) {
        this.company_id = company_id;
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
        this.type = type;
        this.year = year;
        this.employee = employee;
        this.ticket = ticket;
    }

    // Method to get the full name of the proprietor
    getProprietorFullName() {
        return `${this.first} ${this.middle ? this.middle + " " : ""}${this.last}`;
    }

    // Method to get full address
    getFullAddress() {
        return `${this.street}, ${this.barangay}, ${this.town}, ${this.province}, ${this.region}, ${this.country}, ZIP: ${this.zip}`;
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
