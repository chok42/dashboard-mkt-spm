import { CustomerContact } from "../../types/crm.types";

/**
 * Service to connect with Google AppScript for writing to Google Sheets
 * 
 * To use this:
 * 1. Create a Google Sheet.
 * 2. Go to Extensions -> Apps Script.
 * 3. Write a doPost(e) function to parse e.parameter and appendRow to the active sheet.
 * 4. Deploy as a Web App (execute as you, access to anyone).
 * 5. Paste the Web App URL below.
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec"; // Replace with your actual AppScript Web App URL

export const googleSheetsService = {
  /**
   * Post a new customer contact to a Google Sheet
   * @param contact The customer contact object containing details
   * @param serviceNames The array of hospital service names the customer is interested in
   * @returns boolean indicating success
   */
  async exportContactToSheet(contact: CustomerContact, serviceNames: string[]): Promise<boolean> {
    try {
      // Create form data payload to send to Google AppScript
      const formData = new URLSearchParams();
      formData.append("contactId", contact.cusContact_Id);
      formData.append("fullName", contact.cusContact_FullName);
      formData.append("phone", contact.cusContact_Phone);
      formData.append("details", contact.cusContact_Detail);
      formData.append("notes", contact.cusContact_Note || "-");
      formData.append("date", contact.cusContact_Date);
      formData.append("services", serviceNames.join(", "));
      formData.append("statusId", contact.conStatus_Id);
      formData.append("platformId", contact.platform_Id);
      formData.append("employeeId", contact.employee_Id);

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: formData,
        mode: "no-cors", // 'no-cors' is required in many AppScript setups from localhost unless you handle preflight CORS
      });

      // Note: with mode: 'no-cors', response won't be easily readable, but the request will go through
      return true;
    } catch (error) {
      console.error("Failed to export to Google Sheets via AppScript:", error);
      return false;
    }
  }
};
