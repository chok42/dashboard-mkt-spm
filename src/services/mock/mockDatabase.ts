import {
  Role,
  Department,
  Employee,
  CustomerContact,
  ContactStatus,
  ContactService,
  HospitalService,
  Platform
} from '../../types/crm.types';

export const mockRoles: Role[] = [
  { role_Id: 'R99', role_Name: 'Admin' },
  { role_Id: 'R01', role_Name: 'Manager' },
  { role_Id: 'R02', role_Name: 'Employee' }
];

export const mockDepartments: Department[] = [
  { department_Id: 'D001', department_Name: 'Cardiology (อายุรกรรมหัวใจ)' },
  { department_Id: 'D002', department_Name: 'Pediatrics (กุมารเวชกรรม)' },
  { department_Id: 'D003', department_Name: 'Orthopedics (ศัลยกรรมกระดูก)' },
  { department_Id: 'D004', department_Name: 'Obstetrics & Gynecology (สูตินรีเวช)' },
  { department_Id: 'D005', department_Name: 'IT Support' },
  { department_Id: 'D006', department_Name: 'Customer Service' }
];

export const mockEmployees: Employee[] = [
  {
    employee_Id: 'E1001',
    employee_Code: 'EMP-1001',
    employee_Username: 'admin',
    employee_Password: 'password123',
    employee_FristName: 'Somchai',
    employee_LastName: 'Jaidee',
    employee_Phone: '0812345678',
    employee_Email: 'somchai.j@hospital.com',
    employee_Picture: '',
    employee_CreationDate: '2025-01-01T00:00:00Z',
    employee_Status: 'Active',
    role_Id: 'R99', // Admin
    department_Id: 'D005' // IT Support
  },
  {
    employee_Id: 'E1002',
    employee_Code: 'EMP-1002',
    employee_Username: 'manager',
    employee_Password: 'password123',
    employee_FristName: 'Somsri',
    employee_LastName: 'Rakdee',
    employee_Phone: '0812345679',
    employee_Email: 'somsri.r@hospital.com',
    employee_Picture: '',
    employee_CreationDate: '2025-01-15T00:00:00Z',
    employee_Status: 'Active',
    role_Id: 'R01', // Manager
    department_Id: 'D006' // Customer Service
  },
  {
    employee_Id: 'E1003',
    employee_Code: 'EMP-1003',
    employee_Username: 'employee',
    employee_Password: 'password123',
    employee_FristName: 'Somsak',
    employee_LastName: 'Manee',
    employee_Phone: '0812345680',
    employee_Email: 'somsak.m@hospital.com',
    employee_Picture: '',
    employee_CreationDate: '2025-02-01T00:00:00Z',
    employee_Status: 'Active',
    role_Id: 'R02', // Employee
    department_Id: 'D006' // Customer Service
  }
];

export const mockContactStatuses: ContactStatus[] = [
  { conStatus_Id: 'S01', conStatus_Name: 'อยู่ระหว่างสนทนา (In Conversation)' },
  { conStatus_Id: 'S02', conStatus_Name: 'นัดหมาย (Appointment)' },
  { conStatus_Id: 'S03', conStatus_Name: 'ตรวจแล้ว (Examined)' },
  { conStatus_Id: 'S04', conStatus_Name: 'ยกเลิกนัด (Cancelled)' }
];

export const mockPlatforms: Platform[] = [
  { platform_Id: 'P01', platform_Name: 'Line OA' },
  { platform_Id: 'P02', platform_Name: 'Facebook Supamitr Hospital' },
  { platform_Id: 'P03', platform_Name: 'Facebook Supamitr Cataract' },
  { platform_Id: 'P04', platform_Name: 'Phone Call' },
  { platform_Id: 'P05', platform_Name: 'Walk-in' }
];

export const mockHospitalServices: HospitalService[] = [
  {
    hosService_Id: 'HS1',
    hosService_Code: 'SRV-001',
    hosService_Name: 'ตรวจสุขภาพประจำปี',
    hosService_Description: 'แพ็กเกจตรวจสุขภาพมาตรฐาน',
    hosService_UpdateDate: '2025-01-01T00:00:00Z',
    hosService_CreationDate: '2025-01-01T00:00:00Z',
    hosService_IsShow: 'true'
  },
  {
    hosService_Id: 'HS2',
    hosService_Code: 'SRV-002',
    hosService_Name: 'ตรวจสุขภาพหัวใจ',
    hosService_Description: 'เช็คความเสี่ยงโรคหัวใจ',
    hosService_UpdateDate: '2025-01-01T00:00:00Z',
    hosService_CreationDate: '2025-01-01T00:00:00Z',
    hosService_IsShow: 'true'
  },
  {
    hosService_Id: 'HS3',
    hosService_Code: 'SRV-003',
    hosService_Name: 'ฉีดวัคซีนไข้หวัดใหญ่',
    hosService_Description: 'วัคซีนป้องกันไข้หวัดใหญ่ 4 สายพันธุ์',
    hosService_UpdateDate: '2025-01-01T00:00:00Z',
    hosService_CreationDate: '2025-01-01T00:00:00Z',
    hosService_IsShow: 'true'
  }
];

export const mockCustomerContacts: CustomerContact[] = [
  {
    cusContact_Id: 'CC1001',
    cusContact_FirstName: 'Manee',
    cusContact_MiddleName: '',
    cusContact_LastName: 'Jaidee',
    cusContact_FullName: 'Manee Jaidee',
    cusContact_Phone: '0987654321',
    cusContact_Detail: 'สอบถามเรื่องแพ็กเกจตรวจสุขภาพ',
    cusContact_Note: 'สนใจตรวจวันอาทิตย์',
    cusContact_Date: '2025-03-01T10:30:00Z',
    cusContact_CreationDate: '2025-03-01T10:00:00Z',
    conStatus_Id: '1',
    platform_Id: '1',
    employee_Id: 'E1002'
  }
];

export const mockContactServices: ContactService[] = [
  {
    conService_Id: 'CS1',
    cusContact_Id: 'CC1001',
    hosService_Id: 'HS1'
  }
];
