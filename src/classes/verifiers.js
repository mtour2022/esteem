// src/classes/employee.js
class VerifierModel {
  constructor({
    verifierId = "",
 surname = "",
    middlename = "",
    firstname = "",
    suffix = "",    
    userUID = "",
    designation = "",
    tourism_Id_code = "",
  }) {
    this.verifierId = verifierId;
    this.userUID = userUID;
       this.designation = designation;
       this.tourism_Id_code = tourism_Id_code;
       this.surname = surname;
       this.middlename = middlename;
       this.firstname = firstname;
       this.suffix = suffix;

  }

  getFullName() {
    return `${this.firstname} ${this.middlename ? this.middlename + " " : ""}${this.surname}${this.suffix ? ", " + this.suffix : ""}`;
  }

  toObject() {
    return { ...this };
  }
}

export default VerifierModel;
