// src/classes/employee.js
class Employee {
  constructor({
    employeeId = "",
    userUID = "",
    classification = "",
    companyId = "",
    designation = "",
    application_type = "",
    unit_id = "",
    unit_owner = "",
    surname = "",
    middlename = "",
    firstname = "",
    suffix = "",
    nationality = "",
    birthPlace = {
      town: "",
      province: "",
      country: "",
    },
    presentAddress = {
      street: "",
      barangay: "",
      town: "",
      province: "",
      region: "",
      country: ""
    },
    birthday = "",
    age = "",
    sex = "",
    maritalStatus = "",
    height = "",
    weight = "",
    contact = "",
    email = "",
    education = "",
    emergencyContactName = "",
    emergencyContactNumber = "",
    profilePhoto = "",
    trainingCert = "",
    diploma = "",
    additionalRequirement = "",
    workingPermit = "",
    passportNumber = "",
    agreed = false,
    password = "",
    status = "under review",
    status_history = [],
    work_history = [],
    company_status = "under review",
    company_status_history = [],
    tourism_certificate = [],
    tourism_certificate_history = [],

  }) {
    this.employeeId = employeeId;
    this.userUID = userUID;
    this.classification = classification;
    this.companyId = companyId;
    this.designation = designation;
    this.application_type = application_type;
    this.unit_id = unit_id;
    this.unit_owner = unit_owner;
    this.surname = surname;
    this.middlename = middlename;
    this.firstname = firstname;
    this.suffix = suffix;
    this.nationality = nationality;
    this.birthPlace = birthPlace;
    this.presentAddress = presentAddress;
    this.birthday = birthday;
    this.age = age;
    this.sex = sex;
    this.maritalStatus = maritalStatus;
    this.height = height;
    this.weight = weight;
    this.contact = contact;
    this.email = email;
    this.education = education;
    this.emergencyContactName = emergencyContactName;
    this.emergencyContactNumber = emergencyContactNumber;
    this.profilePhoto = profilePhoto;
    this.trainingCert = trainingCert;
    this.diploma = diploma;
    this.additionalRequirement = additionalRequirement;
    this.workingPermit = workingPermit;
    this.passportNumber = passportNumber;
    this.agreed = agreed;
    this.password = password;
    this.status = status;
    this.status_history = status_history;
    this.work_history = work_history;
    this.company_status = company_status;
    this.company_status_history = company_status_history;
    this.tourism_certificate = tourism_certificate;
    this.tourism_certificate_history = tourism_certificate_history;
  }

  getFullName() {
    return `${this.firstname} ${this.middlename ? this.middlename + " " : ""}${this.surname}${this.suffix ? ", " + this.suffix : ""}`;
  }

  toObject() {
    return { ...this };
  }
}

export default Employee;
