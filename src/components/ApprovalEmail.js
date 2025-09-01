import emailjs from "emailjs-com";

export const sendApprovalEmail = async (employee, cert) => {
  if (!employee?.email && !employee?.email) {
    console.error("No email found for employee");
    return;
  }

  const templateParams = {
    to_email: employee.email || employee?.email,
    to_name: `${employee?.firstname || ""} ${employee?.surname || ""}`.trim() || "Employee",
    cert_id: cert?.tourism_cert_id || "",
    cert_type: cert?.type || "",
    cert_issued: cert?.date_Issued || "",
    cert_expired: cert?.date_Expired || "",
    company_email: "lgumalaytourism@yahoo.com",
    footer: `
      LGU-Malay Municipal Tourism Office
      boracayinfoguide.com
      lgumalaytourism@yahoo.com
      2nd Floor Municipal Tourism Office, Action Center, Malay, Aklan
      (036) 288-8827
    `,
  };

  try {
    await emailjs.send(
      "service_41dozkr",    // replace with your service ID
      "template_de2r7ku",  // replace with your template ID
      templateParams,
      "hbl3BK8TmrlMRqkWW"  // replace with your public key
    );
    console.log("✅ Approval email sent to", templateParams.to_email);
  } catch (error) {
    console.error("❌ Failed to send approval email:", error);
  }
};
