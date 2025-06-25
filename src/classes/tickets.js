class TicketModel {
  constructor({
    company_id = "",
    userUID = "",
    ticket_id = "",
    start_date_time = "",
    end_date_time = "",
    is_same_date = false,
    name = "",
    contact = "",
    accommodation = "",
    isSingleGroup = false,
    isMixedGroup = false,
    address = [],
    activities = [],
    scanned_by = "",
    employee_id = "",
    status = "",
    date_created = "",
    valid_until = "",
    scan_logs = [],
    total_pax = 0,
    total_duration = 0,
    total_expected_payment = 0,
    total_payment = 0,
  } = {}) {
    Object.assign(this, {
      company_id,
      userUID,
      ticket_id,
      start_date_time,
      end_date_time,
      is_same_date,
      name,
      contact,
      accommodation,
      isSingleGroup,
      isMixedGroup,
      address,
      activities,
      scanned_by,
      employee_id,
      status,
      date_created,
      valid_until,
      scan_logs,
      total_pax,
      total_duration,
      total_expected_payment,
      total_payment,
    });
  }

  toObject(fields = {}) {
    return {
      ...fields,
    };
  }
}


export default TicketModel;
