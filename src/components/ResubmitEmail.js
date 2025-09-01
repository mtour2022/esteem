import emailjs from "emailjs-com";
import Swal from "sweetalert2";

export const sendResubmitEmail = async (employee) => {
  // ✅ Safe recipient email
  console.log("Employee object:", employee);
  const recipientEmail =
    employee?.email?.trim() || employee?.ticket?.email?.trim() || "";
  console.log("Employee recipientEmail:", recipientEmail);

  if (!recipientEmail) {
    console.error("❌ No valid email found for employee:", employee);
    return;
  }

  let resubmitDetails = "";

  // ✅ Always ask user to fill details
  const { value: formValues } = await Swal.fire({
    title: "Resubmit Required",
    html: `
      <input id="swal-input1" class="swal2-input" placeholder="Missing Info 1">
      <input id="swal-input2" class="swal2-input" placeholder="Missing Info 2">
      <input id="swal-input3" class="swal2-input" placeholder="Missing Info 3">
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Submit",
    preConfirm: () => {
      const val1 = document.getElementById("swal-input1").value;
      const val2 = document.getElementById("swal-input2").value;
      const val3 = document.getElementById("swal-input3").value;
      if (!val1 && !val2 && !val3) {
        Swal.showValidationMessage("Please provide at least one detail");
      }
      return { val1, val2, val3 };
    },
  });

  if (!formValues) {
    console.log("❌ User cancelled resubmit details");
    return;
  }

  resubmitDetails = `
    ${formValues.val1 || ""}
    ${formValues.val2 || ""}
    ${formValues.val3 || ""}
  `.trim();

  // ✅ Match template variables exactly
  const templateParams = {
    to_email: employee.email,
    to_name: `${employee?.firstname || ""} ${employee?.surname || ""}`.trim() || "Employee",
    employee_id: employee?.employeeId || "", 
    resubmit_details: resubmitDetails,
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
    console.log("📧 Sending resubmit email to:", recipientEmail, templateParams);
    await emailjs.send(
      "service_41dozkr",   // service ID
      "template_h079iou", // template ID
      templateParams,
      "hbl3BK8TmrlMRqkWW" // public key
    );
    console.log("✅ Resubmit email sent to", recipientEmail);
  } catch (error) {
    console.error("❌ Failed to send resubmit email:", error);
  }
};
