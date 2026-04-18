export interface Role {
  role_Id: string;
  role_Name: string;
}

export interface Department {
  department_Id: string;
  department_Name: string;
}

export interface Employee {
  employee_Id: string;
  employee_Code: string;
  employee_Username: string;
  employee_Password?: string;
  employee_FristName: string;
  employee_LastName: string;
  employee_Phone: string;
  employee_Email: string;
  employee_Picture: string;
  employee_CreationDate: string;
  employee_Status: string;
  role_Id: string;
  department_Id: string;
}

export interface CustomerContact {
  cusContact_Id: string;
  cusContact_FirstName: string;
  cusContact_MiddleName: string;
  cusContact_LastName: string;
  cusContact_FullName: string;
  cusContact_Phone: string;
  cusContact_Detail: string;
  cusContact_Note: string;
  cusContact_Date: string;
  cusContact_CreationDate: string;
  conStatus_Id: string;
  platform_Id: string;
  employee_Id: string;
}

export interface ContactStatus {
  conStatus_Id: string;
  conStatus_Name: string;
}

export interface ContactService {
  conService_Id: string;
  cusContact_Id: string;
  hosService_Id: string;
}

export interface HospitalService {
  hosService_Id: string;
  hosService_Code: string;
  hosService_Name: string;
  hosService_Description: string;
  hosService_UpdateDate: string;
  hosService_CreationDate: string;
  hosService_IsShow: string;
}

export interface Platform {
  platform_Id: string;
  platform_Name: string;
}
