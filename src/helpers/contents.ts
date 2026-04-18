

export const customerContactService = {
  CUSTOMER_CONTACT_URL: `https://script.google.com/macros/s/${import.meta.env.VITE_CUSTOMER_CONTACT_BEARER_TOKEN}/exec`,
};

export const employeeService = {
  EMPLOYEE_URL: `https://script.google.com/macros/s/${import.meta.env.VITE_EMPLOYEE_BEARER_TOKEN}/exec`,
};

export const removeAllStorage = async () => {
  let keys: string[] = [];
  keys.forEach((k) => localStorage.removeItem(k));
  return;
};

export const removeStorage = async (key: string) => {
  localStorage.removeItem(key);
  return;
};

// Local Storage
export const setStorage = (key: string, value: string) => localStorage.setItem(key, value);
export const getStorage = (key: string) => localStorage.getItem(key);
