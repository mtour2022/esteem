export class TourismCertificateModel {
  constructor(data = {}) {
    this.tourism_cert_id = data.tourism_cert_id || "";
    this.type = data.type || "";
    this.date_Issued = data.date_Issued || "";
    this.date_Expired = data.date_Expired || "";
    this.image_link = data.image_link || "";
    this.employee_id = data.employee_id || "";
    this.verifier_id = data.verifier_id || "";    
    this.company_id = data.company_id || "";
    this.tourism_cert_history = data.tourism_cert_history || "";
  }
}
