import { 
  CustomerContact, 
  Department, 
  Role, 
  ContactStatus, 
  Platform, 
  HospitalService,
  Employee
} from '../../types/crm.types';

import {
  mockCustomerContacts,
  mockContactServices,
  mockDepartments,
  mockRoles,
  mockContactStatuses,
  mockPlatforms,
  mockHospitalServices,
  mockEmployees
} from '../mock/mockDatabase';
import { customerContactService, employeeService } from '../../helpers/contents';

// Local Mock Fallback State
let contactsDB = [...mockCustomerContacts];
let contactServicesDB = [...mockContactServices];
let platformsDB = [...mockPlatforms];
let hospitalServicesDB = [...mockHospitalServices];
let employeesDB = [...mockEmployees];

export interface ContactFilters {
  search?: string;
  platformId?: string;
  statusId?: string;
  serviceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedContacts {
  current_page: number;
  limit: number;
  total_pages: number;
  total_count: number;
  items: CustomerContact[];
}

export interface ContactReport {
  total_contacts: number;
  by_platform: Record<string, number>;
  by_status: Record<string, number>;
  by_service: Record<string, number>;
}

// Helper to interact with Google App Script
const callAppScript = async (action: string, payload: any = {}, baseUrl?: string) => {
  const url = baseUrl || customerContactService.CUSTOMER_CONTACT_URL;
  if (!url || url.includes("undefined")) {
    throw new Error("No App Script URL configured");
  }

  // App Script typically prefers form-urlencoded for simple CORS or simple stringified JSON
  // Since we also support GET, we'll use POST with stringified body
  const response = await fetch(url + "?action=" + action, {
    method: 'POST',
    body: JSON.stringify({ action, ...payload }),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // Bypass CORS preflight
    },
    redirect: 'follow', // Crucial for App Script
  });

  if (!response.ok) {
    throw new Error("HTTP error " + response.status);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "App Script Error");
  }
  // If the action is GET, AppScript returns pagination meta at the root layer (like result.page, result.total)
  if (action === "GET") {
      return {
          current_page: result.page,
          limit: result.pageSize,
          total_pages: result.totalPages,
          total_count: result.total,
          items: result.data
      };
  }
  return result.data;
};

const callEmployeeAppScript = (action: string, payload: any = {}) => {
  return callAppScript(action, payload, employeeService.EMPLOYEE_URL);
};

// Simulate network delay for mock fallback
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const crmService = {
  // References (Keep mocked for now as per prompt focus)
  getDepartments: async (): Promise<Department[]> => {
    await delay(300);
    return mockDepartments;
  },
  getRoles: async (): Promise<Role[]> => {
    await delay(300);
    return mockRoles;
  },
  getStatuses: async (): Promise<ContactStatus[]> => {
    try {
      return await callAppScript("GET_STATUSES");
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      return mockContactStatuses;
    }
  },
  // Platforms CRUD
  getPlatforms: async (): Promise<Platform[]> => {
    try {
      return await callAppScript("GET_PLATFORMS");
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      return [...platformsDB];
    }
  },
  createPlatform: async (platform: Omit<Platform, 'platform_Id'>): Promise<Platform> => {
    try {
      return await callAppScript("INSERT_PLATFORM", platform);
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      const newP = { ...platform, platform_Id: `P${Date.now()}` };
      platformsDB.push(newP);
      return newP;
    }
  },
  updatePlatform: async (id: string, updates: Partial<Platform>): Promise<Platform> => {
    try {
      return await callAppScript("UPDATE_PLATFORM", { platform_Id: id, ...updates });
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      const idx = platformsDB.findIndex(p => p.platform_Id === id);
      if (idx === -1) throw new Error("Not found");
      platformsDB[idx] = { ...platformsDB[idx], ...updates };
      return platformsDB[idx];
    }
  },
  deletePlatform: async (id: string): Promise<boolean> => {
    try {
      await callAppScript("DELETE_PLATFORM", { id });
      return true;
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      platformsDB = platformsDB.filter(p => p.platform_Id !== id);
      return true;
    }
  },

  // Hospital Services CRUD
  getHospitalServices: async (): Promise<HospitalService[]> => {
    try {
      return await callAppScript("GET_SERVICES");
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      return [...hospitalServicesDB];
    }
  },
  createHospitalService: async (service: Partial<HospitalService>): Promise<HospitalService> => {
    try {
      return await callAppScript("INSERT_SERVICE", service);
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      const newS = { 
        ...service, 
        hosService_Id: `HS${Date.now()}`,
        hosService_CreationDate: new Date().toISOString(),
        hosService_UpdateDate: new Date().toISOString(),
      } as HospitalService;
      hospitalServicesDB.push(newS);
      return newS;
    }
  },
  updateHospitalService: async (id: string, updates: Partial<HospitalService>): Promise<HospitalService> => {
    try {
      return await callAppScript("UPDATE_SERVICE", { hosService_Id: id, ...updates });
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      const idx = hospitalServicesDB.findIndex(s => s.hosService_Id === id);
      if (idx === -1) throw new Error("Not found");
      hospitalServicesDB[idx] = { ...hospitalServicesDB[idx], ...updates, hosService_UpdateDate: new Date().toISOString() };
      return hospitalServicesDB[idx];
    }
  },
  deleteHospitalService: async (id: string): Promise<boolean> => {
    try {
      await callAppScript("DELETE_SERVICE", { id });
      return true;
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      hospitalServicesDB = hospitalServicesDB.filter(s => s.hosService_Id !== id);
      return true;
    }
  },

  // Customer Contacts CRUD
  getContacts: async (filters: ContactFilters = {}): Promise<PaginatedContacts> => {
    try {
      return await callAppScript("GET", filters);
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      let items = [...contactsDB];
      
      // Filter mock data manually
      if (filters.search) {
        const s = filters.search.toLowerCase();
        items = items.filter(i => 
          i.cusContact_FullName.toLowerCase().includes(s) || 
          i.cusContact_Phone.includes(s)
        );
      }
      if (filters.platformId) items = items.filter(i => i.platform_Id === filters.platformId);
      if (filters.statusId) items = items.filter(i => i.conStatus_Id === filters.statusId);
      if (filters.startDate && filters.endDate) {
        const sDate = new Date(filters.startDate).getTime();
        const eDate = new Date(filters.endDate).getTime() + 86400000;
        items = items.filter(i => {
          const d = new Date(i.cusContact_Date).getTime();
          return d >= sDate && d <= eDate;
        });
      }
      if (filters.serviceId) {
        const contactIds = contactServicesDB.filter(cs => cs.hosService_Id === filters.serviceId).map(cs => cs.cusContact_Id);
        items = items.filter(i => contactIds.includes(i.cusContact_Id));
      }

      items.sort((a, b) => new Date(b.cusContact_CreationDate).getTime() - new Date(a.cusContact_CreationDate).getTime());

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const total_count = items.length;
      const total_pages = Math.ceil(total_count / limit);
      const offset = (page - 1) * limit;

      return {
        current_page: page,
        limit,
        total_pages,
        total_count,
        items: items.slice(offset, offset + limit)
      };
    }
  },

  getContactById: async (id: string): Promise<{ contact: CustomerContact; serviceIds: string[] } | null> => {
    try {
      return await callAppScript("GET_BY_ID", { id });
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      const contact = contactsDB.find(c => c.cusContact_Id === id);
      if (!contact) return null;
      const serviceIds = contactServicesDB.filter(cs => cs.cusContact_Id === id).map(cs => cs.hosService_Id);
      return { contact, serviceIds };
    }
  },

  createContact: async (contact: Omit<CustomerContact, 'cusContact_Id' | 'cusContact_CreationDate'>, serviceIds: string[]): Promise<CustomerContact> => {
    try {
      return await callAppScript("INSERT", { ...contact, serviceIds });
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(500);
      const newId = `CC${Date.now()}`;
      const newContact: CustomerContact = {
        ...contact,
        cusContact_Id: newId,
        cusContact_CreationDate: new Date().toISOString(),
      } as CustomerContact;
      
      contactsDB.push(newContact);
      serviceIds.forEach(srvId => {
        contactServicesDB.push({
          conService_Id: `CS${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          cusContact_Id: newId,
          hosService_Id: srvId
        });
      });
      return newContact;
    }
  },

  bulkCreateContacts: async (data: { contact: Omit<CustomerContact, 'cusContact_Id' | 'cusContact_CreationDate'>, serviceIds: string[] }[]): Promise<boolean> => {
    try {
      await callAppScript("BULK_INSERT", { data });
      return true;
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(1000);
      data.forEach(({ contact, serviceIds }) => {
        const newId = `CC${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const newContact: CustomerContact = {
          ...contact,
          cusContact_Id: newId,
          cusContact_CreationDate: new Date().toISOString(),
        } as CustomerContact;
        
        contactsDB.push(newContact);
        serviceIds.forEach(srvId => {
          contactServicesDB.push({
            conService_Id: `CS${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            cusContact_Id: newId,
            hosService_Id: srvId
          });
        });
      });
      return true;
    }
  },

  updateContact: async (id: string, contactUpdates: Partial<CustomerContact>, newServiceIds: string[]): Promise<CustomerContact> => {
    try {
      return await callAppScript("UPDATE", { cusContact_Id: id, ...contactUpdates, serviceIds: newServiceIds });
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(500);
      const idx = contactsDB.findIndex(c => c.cusContact_Id === id);
      if (idx === -1) throw new Error("Contact not found");

      contactsDB[idx] = { ...contactsDB[idx], ...contactUpdates };
      contactServicesDB = contactServicesDB.filter(cs => cs.cusContact_Id !== id);
      newServiceIds.forEach(srvId => {
        contactServicesDB.push({
          conService_Id: `CS${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          cusContact_Id: id,
          hosService_Id: srvId
        });
      });
      return contactsDB[idx];
    }
  },

  deleteContact: async (id: string): Promise<boolean> => {
    try {
      await callAppScript("DELETE", { id });
      return true;
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(500);
      contactsDB = contactsDB.filter(c => c.cusContact_Id !== id);
      contactServicesDB = contactServicesDB.filter(cs => cs.cusContact_Id !== id);
      return true;
    }
  },

  hideContact: async (id: string): Promise<boolean> => {
    try {
      await callAppScript("HIDE", { id });
      return true;
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(500);
      // Soft delete in mock
      contactsDB = contactsDB.filter(c => c.cusContact_Id !== id);
      contactServicesDB = contactServicesDB.filter(cs => cs.cusContact_Id !== id);
      return true;
    }
  },

  getContactReport: async (): Promise<ContactReport> => {
    try {
       return await callAppScript("GET_REPORT");
    } catch (e) {
       console.warn("AppScript failed, using mock data", e);
       await delay(300);
       const report: ContactReport = {
          total_contacts: contactsDB.length,
          by_platform: {},
          by_status: {},
          by_service: {}
       };

       contactsDB.forEach(c => {
         const st = c.conStatus_Id || "Unknown";
         const pl = c.platform_Id || "Unknown";
         report.by_status[st] = (report.by_status[st] || 0) + 1;
         report.by_platform[pl] = (report.by_platform[pl] || 0) + 1;
       });

       contactServicesDB.forEach(cs => {
         report.by_service[cs.hosService_Id] = (report.by_service[cs.hosService_Id] || 0) + 1;
       });

       return report;
    }
  },

  // Employees CRUD
  getEmployees: async (): Promise<Employee[]> => {
    try {
      return await callEmployeeAppScript("GET_EMPLOYEES");
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      return [...employeesDB];
    }
  },
  createEmployee: async (employee: Omit<Employee, 'employee_Id' | 'employee_CreationDate'>): Promise<Employee> => {
    try {
      return await callEmployeeAppScript("INSERT_EMPLOYEE", employee);
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      const newE = { 
        ...employee, 
        employee_Id: `E${Date.now()}`,
        employee_CreationDate: new Date().toISOString()
      } as Employee;
      employeesDB.push(newE);
      return newE;
    }
  },
  updateEmployee: async (id: string, updates: Partial<Employee>): Promise<Employee> => {
    try {
      return await callEmployeeAppScript("UPDATE_EMPLOYEE", { employee_Id: id, ...updates });
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      const idx = employeesDB.findIndex(e => e.employee_Id === id);
      if (idx === -1) throw new Error("Employee not found");
      employeesDB[idx] = { ...employeesDB[idx], ...updates };
      return employeesDB[idx];
    }
  },
  deleteEmployee: async (id: string): Promise<boolean> => {
    try {
      await callEmployeeAppScript("DELETE_EMPLOYEE", { id });
      return true;
    } catch (e) {
      console.warn("AppScript failed, using mock data", e);
      await delay(300);
      employeesDB = employeesDB.filter(e => e.employee_Id !== id);
      return true;
    }
  }
};
