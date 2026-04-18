// Employee management & Auth Google Apps Script
const SHEET_EMPLOYEES = "employees";

function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    const action = payload.action;
    switch (action) {
      case "LOGIN": return login(payload);
      case "GET_EMPLOYEES": return getEmployees(payload);
      case "INSERT_EMPLOYEE": return insertEmployee(payload);
      case "UPDATE_EMPLOYEE": return updateEmployee(payload);
      case "DELETE_EMPLOYEE": return deleteEmployee(payload.id);
      default:
        return response({ success: false, message: "Invalid action" });
    }
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

function doGet(e) {
  return doPost(e);
}

function getSheetEMP() {
  return SpreadsheetApp.getActive().getSheetByName(SHEET_EMPLOYEES);
}

function response(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateUUIDv4() {
  return Utilities.getUuid();
}

/* =======================================
   EMPLOYEES & AUTH CRUD
   ======================================= */
//GenerateHashPassword
function generateHashPassword(password) {
  var text = password

  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    text,
    Utilities.Charset.UTF_8
  );

  return bytes.map(b => {
    var v = b < 0 ? b + 256 : b;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function login(payload) {
  try {
    const { username, password } = payload;
    const sheet = getSheetEMP();
    if (!sheet) throw new Error("Employees Sheet not found");

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) throw new Error("No employees found");

    const header = data.shift();
    const userIndex = header.indexOf("employee_Username");
    const pwdIndex = header.indexOf("employee_Password");

    if (userIndex === -1 || pwdIndex === -1) throw new Error("Invalid Employee Sheet format");

    let foundUser = null;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const hashPassword = generateHashPassword(password);
      if (row[userIndex] === username && row[pwdIndex] === hashPassword) {
        let obj = {};
        header.forEach((h, idx) => obj[h] = row[idx]);
        foundUser = obj;
        break;
      }
    }

    if (!foundUser) {
      return response({ success: false, message: "Invalid username or password", status: "401" });
    }

    // Do not return password in response
    if (foundUser.employee_Password) delete foundUser.employee_Password;

    return response({ success: true, message: "Login successful", status: "200", data: foundUser });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

function getEmployees(filters) {
  try {
    const sheet = getSheetEMP();
    if (!sheet) throw new Error("Sheet not found");

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return response({ success: true, data: [], message: "No data" });

    const header = data.shift();
    let result = data.map(row => {
      let obj = {};
      header.forEach((h, i) => obj[h] = row[i]);
      // Exclude password
      delete obj['employee_Password'];
      return obj;
    });

    return response({ data: result, success: true, message: "Successfully retrieved", status: "200" });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

function insertEmployee(payload) {
  try {
    const sheet = getSheetEMP();
    let headers = sheet.getDataRange().getValues()[0];

    // Check if username exists
    const data = sheet.getDataRange().getValues();
    const userIdx = headers.indexOf("employee_Username");
    if (data.some(r => r[userIdx] === payload.employee_Username)) {
      throw new Error("Username already exists");
    }

    const newId = generateUUIDv4();
    const newRecord = {
      ...payload,
      employee_Id: newId,
      employee_CreationDate: new Date().toISOString()
    };

    const rowData = headers.map(h => newRecord[h] !== undefined ? newRecord[h] : "");
    sheet.appendRow(rowData);

    if (newRecord.employee_Password) delete newRecord.employee_Password;
    return response({ success: true, message: "Created employee successfully", status: "200", data: newRecord });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

function updateEmployee(payload) {
  try {
    const id = payload.employee_Id;
    const sheet = getSheetEMP();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf("employee_Id");

    const rowIndex = data.findIndex((r, idx) => idx > 0 && r[idIndex] === id);
    if (rowIndex === -1) throw new Error("Employee not found");

    headers.forEach((h, colIndex) => {
      if (h !== "employee_Id" && h !== "employee_CreationDate" && payload[h] !== undefined) {
        sheet.getRange(rowIndex + 1, colIndex + 1).setValue(payload[h]);
      }
    });

    let updatedEmployee = {};
    const updatedRow = sheet.getRange(rowIndex + 1, 1, 1, headers.length).getValues()[0];
    headers.forEach((h, i) => updatedEmployee[h] = updatedRow[i]);
    if (updatedEmployee.employee_Password) delete updatedEmployee.employee_Password;

    return response({ success: true, message: "Updated successfully", status: "200", data: updatedEmployee });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

function deleteEmployee(id) {
  try {
    const sheet = getSheetEMP();
    const data = sheet.getDataRange().getValues();
    const idIndex = data[0].indexOf("employee_Id");

    const rowIndex = data.findIndex((r, idx) => idx > 0 && r[idIndex] === id);
    if (rowIndex !== -1) {
      sheet.deleteRow(rowIndex + 1);
    }
    return response({ success: true, message: "Deleted successfully", status: "200" });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}
