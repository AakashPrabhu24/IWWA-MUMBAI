/**
 * Google Apps Script: IWWA Mumbai Registration Backend Router
 * 
 * Paste this code into your Google Sheet's Apps Script Editor:
 * 1. Open your spreadsheet.
 * 2. Go to Extensions -> Apps Script.
 * 3. Replace all contents of Code.gs with this script.
 * 4. Save and click "Deploy" -> "New Deployment" -> "Web App".
 * 5. Configure "Execute as: Me" and "Who has access: Anyone".
 * 6. Copy the generated Web App URL and set it as SCRIPT_URL in:
 *    - delegate-registration.html
 *    - sponsorship.html
 *    - advertisement-standee.html
 */

// Handle GET requests — used for BOTH status checks AND data submission
function doGet(e) {
  // If form data parameters are present, process as registration
  if (e && e.parameter && e.parameter.formType) {
    return processRegistration(e.parameter);
  }

  // Otherwise return a status message
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "IWWA Mumbai Registration API is running."
  })).setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests — fallback for form submissions
function doPost(e) {
  if (!e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "No event data received."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var data = {};

  if (e.parameter && e.parameter.formType) {
    data = e.parameter;
  } else if (e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (jsonErr) {
      data = e.parameter || {};
    }
  } else {
    data = e.parameter || {};
  }

  return processRegistration(data);
}

// Shared registration processor — works with both GET and POST data
function processRegistration(data) {
  try {
    var formType = data.formType;

    if (!formType) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Form type not specified."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var email = data.email;
    var mobile = data.mobile;

    // Validate Required Fields
    if (!email || !mobile) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Email and Mobile are required."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    email = email.toString().trim();
    mobile = mobile.toString().trim();

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet;
    var timestamp = new Date();

    // Upload file to Google Drive if present (applies to all forms)
    var fileUrl = "No Receipt Uploaded";
    if (data.fileData && data.fileName) {
      try {
        var folder = DriveApp.getRootFolder();
        var folders = DriveApp.getFoldersByName("IWWA_Receipts");
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder("IWWA_Receipts");
        }
        
        var fileParts = data.fileData.split(',');
        var base64Data = fileParts[1] || fileParts[0];
        var contentType = "application/pdf";
        if (fileParts[0].indexOf(":") > -1 && fileParts[0].indexOf(";") > -1) {
           contentType = fileParts[0].substring(fileParts[0].indexOf(":") + 1, fileParts[0].indexOf(";"));
        }
        
        var decodedBytes = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(decodedBytes, contentType, data.fileName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = file.getUrl();
      } catch (fileErr) {
        fileUrl = "Upload Error: " + fileErr.toString();
      }
    }

    // Route based on formType
    if (formType === "delegate") {
      var name = data.name || "N/A";
      var designation = data.designation || "N/A";
      var membershipNo = data.membershipNo || "N/A";
      var feePaid = data.feePaid || "N/A";

      sheet = ss.getSheetByName("Delegates");
      if (!sheet) {
        sheet = ss.insertSheet("Delegates");
        sheet.appendRow(["Timestamp", "Name", "Designation", "IWWA Membership No.", "Email Address", "Mobile Number", "Fee Paid", "Payment"]);
        sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#d3e1f6");
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([timestamp, name, designation, membershipNo, email, mobile, feePaid, fileUrl]);

    } else if (formType === "sponsor") {
      var organisation = data.organisation || "N/A";
      var sponsorCategory = data.sponsorCategory || "N/A";
      var feePaid = data.feePaid || "N/A";
      sheet = ss.getSheetByName("Sponsorships");
      if (!sheet) {
        sheet = ss.insertSheet("Sponsorships");
        sheet.appendRow(["Timestamp", "Organisation", "Email Address", "Mobile Number", "Sponsor Category", "Fee Paid", "Payment"]);
        sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#d3e1f6");
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([timestamp, organisation, email, mobile, sponsorCategory, feePaid, fileUrl]);

    } else if (formType === "standee") {
      var organisation = data.organisation || "N/A";
      var feePaid = data.feePaid || "N/A";
      sheet = ss.getSheetByName("Standees");
      if (!sheet) {
        sheet = ss.insertSheet("Standees");
        sheet.appendRow(["Timestamp", "Organisation", "Email Address", "Mobile Number", "Fee Paid", "Payment"]);
        sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#d3e1f6");
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([timestamp, organisation, email, mobile, feePaid, fileUrl]);

    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Invalid formType: " + formType
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Registration completed successfully!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("Registration Error:", error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Server Error: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
