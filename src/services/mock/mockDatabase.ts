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

export const mockContactStatuses: ContactStatus[] = [];

export const mockPlatforms: Platform[] = [];

export const mockHospitalServices: HospitalService[] = [];

export const mockCustomerContacts: CustomerContact[] = [];

export const mockContactServices: ContactService[] = [];
