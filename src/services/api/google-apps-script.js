//sheet
const SHEET_CUSTOMER_CONTACT = "customer_contacts";
const SHEET_CONTACT_STATUS = "contact_status";
const SHEET_CONTACT_SERVICE = "contact_services";
const SHEET_HOSPITAL_SERVICE = "hospital_services";
const SHEET_PLATFORM = "platforms";
//folder
const FOLDER_FILE_ID = "";

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
      case "GET":
        return getCustomerContacts(payload);
      case "GET_BY_ID":
        return getContactById(payload.id);
      case "INSERT":
        return insertContact(payload);
      case "BULK_INSERT":
        return bulkInsertContacts(payload);
      case "UPDATE":
        return updateContact(payload);
      case "HIDE":
        return hideContact(payload.id);
      case "DELETE":
        return deleteContact(payload.id);
      case "GET_REPORT":
        return getReport();
      
      // Services
      case "GET_SERVICES": return getHospitalServices(payload);
      case "INSERT_SERVICE": return insertHospitalService(payload);
      case "UPDATE_SERVICE": return updateHospitalService(payload);
      case "DELETE_SERVICE": return deleteHospitalService(payload.id);
      
      // Platforms
      case "GET_PLATFORMS": return getPlatforms(payload);
      case "INSERT_PLATFORM": return insertPlatform(payload);
      case "UPDATE_PLATFORM": return updatePlatform(payload);
      case "DELETE_PLATFORM": return deletePlatform(payload.id);

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

function getSheetCCT() {
  return SpreadsheetApp.getActive().getSheetByName(SHEET_CUSTOMER_CONTACT);
}

function getSheetCST() {
  return SpreadsheetApp.getActive().getSheetByName(SHEET_CONTACT_STATUS);
}

function getSheetCSV() {
  return SpreadsheetApp.getActive().getSheetByName(SHEET_CONTACT_SERVICE);
}

function getSheetHS() {
  return SpreadsheetApp.getActive().getSheetByName(SHEET_HOSPITAL_SERVICE);
}

function getSheetPLT() {
  return SpreadsheetApp.getActive().getSheetByName(SHEET_PLATFORM);
}

function response(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

//Generate
function generateUUIDv4() {
  var uuid = Utilities.getUuid();
  Logger.log(uuid);
  return uuid;
}

function generateMaxCode() {
  const sheet = getSheetCCT();
  const lastRow = sheet.getLastRow();
  const year = new Date().toLocaleDateString('th-TH', { year: 'numeric' }).substr(-2)
  if (lastRow < 2) return `CC${year}0001`; // Adjust prefix if needed

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); // Assuming ID is in column 1 (A)

  let maxNumber = 0;

  values.forEach(row => {
    if (row[0]) {
      const num = parseInt(row[0].toString().replace(`CC${year}`, ""), 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  });

  const nextNumber = maxNumber + 1;
  const newId = `CC${year}` + String(nextNumber).padStart(4, "0");
  console.log('newId:', newId)
  return newId
}

/* ---------- GET LIST ---------- */
function getCustomerContacts(filters) {
  try {
    const sheet = getSheetCCT();
    if (!sheet) throw new Error("Sheet not found");

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return response({
        page: 1, pageSize: 10, total: 0, totalPages: 0, data: [],
        success: true, message: "Success", status: "200"
      });
    }

    let page = Number(filters.page || 1);
    let pageSize = Number(filters.limit || filters.pageSize || 10);

    const header = data.shift();

    let result = data.map(row => {
      let obj = {};
      header.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
    if (result && result.length > 0) {

      // Default hide hidden contacts
      result = result.filter(item => item.cusContact_IsHidden !== true && item.cusContact_IsHidden !== "true");

      // Filtering logic
      if (filters.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(i =>
          (i.cusContact_FullName && i.cusContact_FullName.toLowerCase().includes(s)) ||
          (i.cusContact_Phone && i.cusContact_Phone.includes(s))
        );
      }
      if (filters.platformId) {
        result = result.filter(i => i.platform_Id === filters.platformId);
      }
      if (filters.statusId) {
        result = result.filter(i => i.conStatus_Id === filters.statusId);
      }
      if (filters.startDate && filters.endDate) {
        const sDate = new Date(filters.startDate).getTime();
        const eDate = new Date(filters.endDate).getTime() + 86400000;
        result = result.filter(i => {
          const d = new Date(i.cusContact_Date).getTime();
          return d >= sDate && d <= eDate;
        });
      }
      if (filters.serviceId) {
        const srvSheet = getSheetCSV();
        if (srvSheet) {
          const srvData = srvSheet.getDataRange().getValues().slice(1);
          // Assuming service sheet: Col A: ID, Col B: Contact ID, Col C: Service ID
          const contactIdsWithService = srvData
            .filter(row => row[2] === filters.serviceId)
            .map(row => row[1]);

          result = result.filter(i => contactIdsWithService.includes(i.cusContact_Id));
        }
      }

      // Sort Descending by Date
      result.sort((a, b) => new Date(b.cusContact_CreationDate) - new Date(a.cusContact_CreationDate));

      const total = result.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      return response({
        page,
        pageSize,
        total: total,
        totalPages: totalPages,
        data: result.slice(start, end),
        success: true,
        message: "Successfully retrieved data",
        status: "200"
      });
    }
    response({ success: false, message: 'No data found', status: "404" });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

/* ---------- GET BY ID ---------- */
function getContactById(id) {
  try {
    const sheet = getSheetCCT();
    if (!sheet) throw new Error("Sheet not found");

    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const row = data.find(r => r[headers.indexOf("cusContact_Id")] === id);
    if (!row) throw new Error("Contact not found");

    let contact = {};
    headers.forEach((h, i) => contact[h] = row[i]);

    let serviceIds = [];
    const srvSheet = getSheetCSV();
    if (srvSheet) {
      const srvData = srvSheet.getDataRange().getValues().slice(1);
      serviceIds = srvData
        .filter(r => r[1] === id)
        .map(r => r[2]);
    }

    return response({
      success: true,
      message: "Successfully fetched contact",
      status: "200",
      data: { contact, serviceIds }
    });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

/* ---------- INSERT ---------- */
function insertContact(payload) {
  try {
    const sheet = getSheetCCT();
    const srvSheet = getSheetCSV();

    let headers = sheet.getDataRange().getValues()[0];

    const newId = generateUUIDv4();
    const newRecord = {
      cusContact_Id: newId,
      cusContact_FirstName: payload.cusContact_FirstName || "",
      cusContact_MiddleName: payload.cusContact_MiddleName || "",
      cusContact_LastName: payload.cusContact_LastName || "",
      cusContact_FullName: payload.cusContact_FullName || "",
      cusContact_Phone: payload.cusContact_Phone || "",
      cusContact_Detail: payload.cusContact_Detail || "",
      cusContact_Note: payload.cusContact_Note || "",
      cusContact_Date: payload.cusContact_Date || new Date().toISOString(),
      cusContact_CreationDate: new Date().toISOString(),
      conStatus_Id: payload.conStatus_Id || "",
      platform_Id: payload.platform_Id || "",
      employee_Id: payload.employee_Id || "",
      cusContact_IsHidden: false
    };

    const rowData = headers.map(h => newRecord[h] !== undefined ? newRecord[h] : "");
    sheet.appendRow(rowData);

    // Insert Services
    if (payload.serviceIds) {
      let srvArray = Array.isArray(payload.serviceIds) ? payload.serviceIds : payload.serviceIds.split(",");
      srvArray.forEach(srvId => {
        srvId = srvId.trim();
        if (!srvId) return;
        if (srvSheet) {
          const csId = generateUUIDv4();
          srvSheet.appendRow([csId, newId, srvId]);
        }
      });
    }

    return response({
      success: true,
      message: "Successfully created contact",
      status: "200",
      data: newRecord
    });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

/* ---------- BULK INSERT ---------- */
function bulkInsertContacts(payload) {
  try {
    const data = payload.data;
    if (!data || !Array.isArray(data)) throw new Error("Invalid data format for bulk insert");

    const sheet = getSheetCCT();
    const srvSheet = getSheetCSV();
    const headers = sheet.getDataRange().getValues()[0];

    const contactRows = [];
    const serviceRows = [];
    const now = new Date().toISOString();

    data.forEach(item => {
      const contact = item.contact;
      const serviceIds = item.serviceIds || [];
      const newId = generateUUIDv4();

      const newRecord = {
        cusContact_Id: newId,
        cusContact_FirstName: contact.cusContact_FirstName || "",
        cusContact_MiddleName: contact.cusContact_MiddleName || "",
        cusContact_LastName: contact.cusContact_LastName || "",
        cusContact_FullName: contact.cusContact_FullName || "",
        cusContact_Phone: contact.cusContact_Phone || "",
        cusContact_Detail: contact.cusContact_Detail || "",
        cusContact_Note: contact.cusContact_Note || "",
        cusContact_Date: contact.cusContact_Date || now,
        cusContact_CreationDate: now,
        conStatus_Id: contact.conStatus_Id || "",
        platform_Id: contact.platform_Id || "",
        employee_Id: contact.employee_Id || "",
        cusContact_IsHidden: false
      };

      const rowData = headers.map(h => newRecord[h] !== undefined ? newRecord[h] : "");
      contactRows.push(rowData);

      // Prepare Services
      let srvArray = Array.isArray(serviceIds) ? serviceIds : serviceIds.split(",");
      srvArray.forEach(srvId => {
        srvId = srvId.trim();
        if (!srvId) return;
        const csId = generateUUIDv4();
        serviceRows.push([csId, newId, srvId]);
      });
    });

    // Batch write contacts
    if (contactRows.length > 0) {
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, contactRows.length, headers.length).setValues(contactRows);
    }

    // Batch write services
    if (serviceRows.length > 0) {
      const lastSrvRow = srvSheet.getLastRow();
      srvSheet.getRange(lastSrvRow + 1, 1, serviceRows.length, 3).setValues(serviceRows);
    }

    return response({
      success: true,
      message: `Successfully created ${contactRows.length} contacts`,
      status: "200"
    });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

/* ---------- UPDATE ---------- */
function updateContact(payload) {
  try {
    const id = payload.cusContact_Id;
    const sheet = getSheetCCT();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const idIndex = headers.indexOf("cusContact_Id");
    const rowIndex = data.findIndex((r, idx) => idx > 0 && r[idIndex] === id);

    if (rowIndex === -1) throw new Error("Contact not found");

    const actualRowNumber = rowIndex + 1;

    headers.forEach((h, colIndex) => {
      // Do not update Id and creation date
      if (h !== "cusContact_Id" && h !== "cusContact_CreationDate" && payload[h] !== undefined) {
        sheet.getRange(actualRowNumber, colIndex + 1).setValue(payload[h]);
      }
    });

    // Update services
    if (payload.serviceIds !== undefined) {
      const srvSheet = getSheetCSV();
      if (srvSheet) {
        const srvData = srvSheet.getDataRange().getValues();
        for (let i = srvData.length - 1; i > 0; i--) {
          if (srvData[i][1] === id) {
            srvSheet.deleteRow(i + 1);
          }
        }
        let srvArray = Array.isArray(payload.serviceIds) ? payload.serviceIds : payload.serviceIds.split(",");
        srvArray.forEach(srvId => {
          srvId = srvId.trim();
          if (!srvId) return;
          const csId = generateUUIDv4();
          srvSheet.appendRow([csId, id, srvId]);
        });
      }
    }

    let updatedContact = {};
    const updatedRow = sheet.getRange(actualRowNumber, 1, 1, headers.length).getValues()[0];
    headers.forEach((h, i) => updatedContact[h] = updatedRow[i]);

    return response({
      success: true,
      message: "Successfully updated contact",
      status: "200",
      data: { contact: updatedContact }
    });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

/* ---------- HIDE ---------- */
function hideContact(id) {
  try {
    const sheet = getSheetCCT();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const idIndex = headers.indexOf("cusContact_Id");
    const rowIndex = data.findIndex((r, idx) => idx > 0 && r[idIndex] === id);
    if (rowIndex === -1) throw new Error("Contact not found");

    const colIndex = headers.indexOf("cusContact_IsHidden");
    if (colIndex !== -1) {
      sheet.getRange(rowIndex + 1, colIndex + 1).setValue(true);
    }
    return response({ success: true, message: "Successfully hidden contact", status: "200" });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

/* ---------- DELETE ---------- */
function deleteContact(id) {
  try {
    const sheet = getSheetCCT();
    const data = sheet.getDataRange().getValues();
    const idIndex = data[0].indexOf("cusContact_Id");

    const rowIndex = data.findIndex((r, idx) => idx > 0 && r[idIndex] === id);
    if (rowIndex !== -1) {
      sheet.deleteRow(rowIndex + 1);
    }

    const srvSheet = getSheetCSV();
    if (srvSheet) {
      const srvData = srvSheet.getDataRange().getValues();
      for (let i = srvData.length - 1; i > 0; i--) {
        if (srvData[i][1] === id) {
          srvSheet.deleteRow(i + 1);
        }
      }
    }
    return response({ success: true, message: "Successfully deleted contact", status: "200" });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

/* ---------- GET REPORT ---------- */
function getReport() {
  try {
    const sheet = getSheetCCT();
    if (!sheet) throw new Error("Sheet not found");

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return response({ success: true, status: "200", data: { total_contacts: 0, by_platform: {}, by_status: {}, by_service: {} } });

    const headers = data.shift();
    const items = data.map(row => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    }).filter(i => i.cusContact_IsHidden !== true && i.cusContact_IsHidden !== "true");

    const srvSheet = getSheetCSV();
    let srvData = [];
    if (srvSheet) {
      srvData = srvSheet.getDataRange().getValues().slice(1);
    }

    let report = {
      total_contacts: items.length,
      by_platform: {},
      by_status: {},
      by_service: {}
    };

    items.forEach(i => {
      const st = i.conStatus_Id || "Unknown";
      report.by_status[st] = (report.by_status[st] || 0) + 1;
      const pl = i.platform_Id || "Unknown";
      report.by_platform[pl] = (report.by_platform[pl] || 0) + 1;
    });

    const validContactIds = new Set(items.map(i => i.cusContact_Id));
    srvData.forEach(row => {
      const cId = row[1];
      const sId = row[2];
      if (validContactIds.has(cId)) {
        report.by_service[sId] = (report.by_service[sId] || 0) + 1;
      }
    });

    return response({
      success: true,
      status: "200",
      data: report
    });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

/* =======================================
   HOSPITAL SERVICES CRUD 
   ======================================= */

function getHospitalServices(filters) {
  try {
    const sheet = getSheetHS();
    if (!sheet) throw new Error("Sheet not found");

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return response({ page: 1, pageSize: 10, total: 0, totalPages: 0, data: [], success: true, message: "Success", status: "200" });

    const header = data.shift();
    let result = data.map(row => {
      let obj = {};
      header.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });

    return response({ data: result, success: true, message: "Successfully retrieved", status: "200" });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

function insertHospitalService(payload) {
  try {
    const sheet = getSheetHS();
    let headers = sheet.getDataRange().getValues()[0];
    
    const newId = generateUUIDv4();
    const newRecord = {
      ...payload,
      hosService_Id: newId,
      hosService_CreationDate: new Date().toISOString(),
      hosService_UpdateDate: new Date().toISOString()
    };
    
    const rowData = headers.map(h => newRecord[h] !== undefined ? newRecord[h] : "");
    sheet.appendRow(rowData);

    return response({ success: true, message: "Created service successfully", status: "200", data: newRecord });
  } catch(err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

function updateHospitalService(payload) {
  try {
    const id = payload.hosService_Id;
    const sheet = getSheetHS();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf("hosService_Id");
    
    const rowIndex = data.findIndex((r, idx) => idx > 0 && r[idIndex] === id);
    if (rowIndex === -1) throw new Error("Service not found");
    
    payload.hosService_UpdateDate = new Date().toISOString();
    
    headers.forEach((h, colIndex) => {
      if (h !== "hosService_Id" && h !== "hosService_CreationDate" && payload[h] !== undefined) {
        sheet.getRange(rowIndex + 1, colIndex + 1).setValue(payload[h]);
      }
    });

    let updatedService = {};
    const updatedRow = sheet.getRange(rowIndex + 1, 1, 1, headers.length).getValues()[0];
    headers.forEach((h, i) => updatedService[h] = updatedRow[i]);

    return response({ success: true, message: "Updated successfully", status: "200", data: updatedService });
  } catch(err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

function deleteHospitalService(id) {
  try {
    const sheet = getSheetHS();
    const data = sheet.getDataRange().getValues();
    const idIndex = data[0].indexOf("hosService_Id");
    
    const rowIndex = data.findIndex((r, idx) => idx > 0 && r[idIndex] === id);
    if (rowIndex !== -1) {
      sheet.deleteRow(rowIndex + 1);
    }
    return response({ success: true, message: "Deleted successfully", status: "200" });
  } catch(err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

/* =======================================
   PLATFORMS CRUD
   ======================================= */

function getPlatforms(filters) {
  try {
    const sheet = getSheetPLT();
    if (!sheet) throw new Error("Sheet not found");

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return response({ page: 1, pageSize: 10, total: 0, totalPages: 0, data: [], success: true, message: "Success", status: "200" });

    const header = data.shift();
    let result = data.map(row => {
      let obj = {};
      header.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });

    return response({ data: result, success: true, message: "Successfully retrieved", status: "200" });
  } catch (err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

function insertPlatform(payload) {
  try {
    const sheet = getSheetPLT();
    let headers = sheet.getDataRange().getValues()[0];
    
    const newId = generateUUIDv4();
    const newRecord = {
      ...payload,
      platform_Id: newId
    };
    
    const rowData = headers.map(h => newRecord[h] !== undefined ? newRecord[h] : "");
    sheet.appendRow(rowData);

    return response({ success: true, message: "Created platform successfully", status: "200", data: newRecord });
  } catch(err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

function updatePlatform(payload) {
  try {
    const id = payload.platform_Id;
    const sheet = getSheetPLT();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf("platform_Id");
    
    const rowIndex = data.findIndex((r, idx) => idx > 0 && r[idIndex] === id);
    if (rowIndex === -1) throw new Error("Platform not found");
    
    headers.forEach((h, colIndex) => {
      if (h !== "platform_Id" && payload[h] !== undefined) {
        sheet.getRange(rowIndex + 1, colIndex + 1).setValue(payload[h]);
      }
    });

    let updatedPlatform = {};
    const updatedRow = sheet.getRange(rowIndex + 1, 1, 1, headers.length).getValues()[0];
    headers.forEach((h, i) => updatedPlatform[h] = updatedRow[i]);

    return response({ success: true, message: "Updated successfully", status: "200", data: updatedPlatform });
  } catch(err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}

function deletePlatform(id) {
  try {
    const sheet = getSheetPLT();
    const data = sheet.getDataRange().getValues();
    const idIndex = data[0].indexOf("platform_Id");
    
    const rowIndex = data.findIndex((r, idx) => idx > 0 && r[idIndex] === id);
    if (rowIndex !== -1) {
      sheet.deleteRow(rowIndex + 1);
    }
    return response({ success: true, message: "Deleted successfully", status: "200" });
  } catch(err) {
    return response({ success: false, message: err.message, status: "500" });
  }
}
