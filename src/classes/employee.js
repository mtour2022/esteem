// src/classes/employee.js
class Employee {
  constructor({
    employeeId = "",
    userUID = "",
    classification = "",
    companyId = "",
    designation = "",
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
    agreed = false,
    password = "",
    status = "pending",
    status_history = [],
  }) {
    this.employeeId = employeeId;
    this.userUID = userUID;
    this.classification = classification;
    this.companyId = companyId;
    this.designation = designation;
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
    this.agreed = agreed;
    this.password = password;
    this.status = status;
    this.status_history = status_history;
  }

  getFullName() {
    return `${this.firstname} ${this.middlename ? this.middlename + " " : ""}${this.surname}${this.suffix ? ", " + this.suffix : ""}`;
  }

  toObject() {
    return { ...this };
  }
}

export default Employee;
