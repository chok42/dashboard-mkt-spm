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

export const mockDepartments: Department[] = [];

export const mockEmployees: Employee[] = [];

export const mockContactStatuses: ContactStatus[] = [
  { conStatus_Id: 'S01', conStatus_Name: 'การสนทนา (Conversation)' },
  { conStatus_Id: 'S02', conStatus_Name: 'นัดหมาย (Appointment)' },
  { conStatus_Id: 'S03', conStatus_Name: 'ตรวจแล้ว (Examined)' },
  { conStatus_Id: 'S04', conStatus_Name: 'ยกเลิกนัด (Cancelled)' }
];

export const mockPlatforms: Platform[] = [];

export const mockHospitalServices: HospitalService[] = [];

export const mockCustomerContacts: CustomerContact[] = [];

export const mockContactServices: ContactService[] = [];
