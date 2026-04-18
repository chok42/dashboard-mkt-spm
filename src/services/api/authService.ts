import { Employee } from '../../types/crm.types';
import { mockEmployees } from '../mock/mockDatabase';
import { employeeService } from '../../helpers/contents';

export const authService = {
  login: async (username: string, password?: string): Promise<Employee> => {
    try {
      const url = employeeService.EMPLOYEE_URL;
      if (!url || url.includes("undefined")) {
        throw new Error("Employee API URL not configured");
      }

      const response = await fetch(url + "?action=LOGIN", {
        method: 'POST',
        body: JSON.stringify({ action: "LOGIN", username, password }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Login failed");
      }

      return result.data;
    } catch (e) {
      console.warn("AppScript Login failed, using mock data", e);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const user = mockEmployees.find(
            (emp) => emp.employee_Username === username && (password ? emp.employee_Password === password : true)
          );
          if (user) {
            resolve(user);
          } else {
            reject(new Error('Invalid username or password'));
          }
        }, 500);
      });
    }
  }
};
