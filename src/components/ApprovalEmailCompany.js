import emailjs from "emailjs-com";

export const sendApprovalEmailCompany = async (company, cert) => {
  if (!company?.email) {
    console.error("❌ No email found for company");
    return;
  }

  const templateParams = {
    to_email: company.email,
    to_name: company.name || "Company",
    cert_id: cert?.tourism_cert_id || company?.latest_cert_summary?.tourism_cert_id || "",
    cert_type: cert?.type || company?.latest_cert_summary?.type || "",
    cert_issued: cert?.date_Issued || company?.latest_cert_summary?.date_Issued || "",
    cert_expired: cert?.date_Expired || company?.latest_cert_summary?.date_Expired || "",
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
      "service_41dozkr",    // ✅ replace with your service ID
      "template_de2r7ku",  // ✅ replace with your template ID
      templateParams,
      "hbl3BK8TmrlMRqkWW"  // ✅ replace with your public key
    );
    console.log("✅ Approval email sent to", templateParams.to_email);
  } catch (error) {
    console.error("❌ Failed to send approval email:", error);
  }
};
