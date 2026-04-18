import { useEffect, useState, useCallback } from "react";
import { Button, Table, Card, Spinner, Modal, TextInput, Label, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { crmService } from "../../services/api/crmService";
import { Employee, Role, Department } from "../../types/crm.types";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router";

const Employees = () => {
  const { role } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  // RBAC: Only Admin (Role 1) can access this page
  if (role !== "R99") {
    return <Navigate to="/" />;
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empList, roleList, deptList] = await Promise.all([
        crmService.getEmployees(),
        crmService.getRoles(),
        crmService.getDepartments()
      ]);
      setEmployees(empList || []);
      setRoles(roleList || []);
      setDepartments(deptList || []);
    } catch (error) {
      console.error("Failed to load employees", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddNew = () => {
    setEditEmployee(null);
    formik.resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditEmployee(employee);
    formik.setValues({
      employee_Code: employee.employee_Code,
      employee_Username: employee.employee_Username,
      employee_FristName: employee.employee_FristName,
      employee_LastName: employee.employee_LastName,
      employee_Phone: employee.employee_Phone,
      employee_Email: employee.employee_Email,
      employee_Status: employee.employee_Status,
      role_Id: employee.role_Id,
      department_Id: employee.department_Id,
      employee_Password: "" // Do not populate password
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This employee record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        await crmService.deleteEmployee(id);
        toast.success("Employee deleted successfully");
        loadData();
      } catch (error) {
        toast.error("Failed to delete employee");
      }
    }
  };

  const formik = useFormik({
    initialValues: {
      employee_Code: "",
      employee_Username: "",
      employee_FristName: "",
      employee_LastName: "",
      employee_Phone: "",
      employee_Email: "",
      employee_Status: "Active",
      role_Id: "R02",
      department_Id: "D001",
      employee_Password: ""
    },
    validationSchema: Yup.object({
      employee_Code: Yup.string().required("Employee Code is required"),
      employee_Username: Yup.string().required("Username is required"),
      employee_FristName: Yup.string().required("First Name is required"),
      employee_LastName: Yup.string().required("Last Name is required"),
      employee_Role: Yup.string(),
      role_Id: Yup.string().required(),
      department_Id: Yup.string().required(),
      employee_Password: Yup.string().when("editEmployee", {
        is: () => !editEmployee,
        then: (schema) => schema.required("Password is required for new employees"),
        otherwise: (schema) => schema.notRequired()
      })
    }),
    onSubmit: async (values, { setSubmitting }) => {
      const toastId = toast.loading(editEmployee ? "Updating employee..." : "Adding employee...");
      try {
        const payload: any = { ...values };
        if (editEmployee) {
          if (!payload.employee_Password) delete payload.employee_Password;
          await crmService.updateEmployee(editEmployee.employee_Id, payload);
          toast.success("Employee updated successfully", { id: toastId });
        } else {
          await crmService.createEmployee(payload as any);
          toast.success("Employee created successfully", { id: toastId });
        }
        setIsModalOpen(false);
        loadData();
      } catch (e) {
        console.error(e);
        toast.error("Failed to save employee.", { id: toastId });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Card className="shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Manage Employees
        </h5>
        <Button onClick={handleAddNew} color="primary" className="bg-primary hover:bg-primary/90 text-white">
          <Icon icon="solar:user-plus-outline" className="mr-2 h-5 w-5" />
          Add Employee
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Spinner size="xl" /></div>
      ) : (
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Code</Table.HeadCell>
              <Table.HeadCell>Full Name</Table.HeadCell>
              <Table.HeadCell>Username</Table.HeadCell>
              <Table.HeadCell>Role</Table.HeadCell>
              <Table.HeadCell>Department</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>
                <span className="sr-only">Actions</span>
              </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {employees.map((emp) => (
                <Table.Row key={emp.employee_Id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">
                    {emp.employee_Code}
                  </Table.Cell>
                  <Table.Cell>{emp.employee_FristName} {emp.employee_LastName}</Table.Cell>
                  <Table.Cell>{emp.employee_Username}</Table.Cell>
                  <Table.Cell>{roles.find(r => r.role_Id === emp.role_Id)?.role_Name || emp.role_Id}</Table.Cell>
                  <Table.Cell>{departments.find(d => d.department_Id === emp.department_Id)?.department_Name || emp.department_Id}</Table.Cell>
                  <Table.Cell>
                    <span className={emp.employee_Status === 'Active' ? "text-green-500 font-semibold" : "text-red-500"}>
                      {emp.employee_Status}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="flex gap-2 justify-end">
                    <Button size="sm" color="light" onClick={() => handleEdit(emp)}>
                      <Icon icon="solar:pen-new-round-linear" className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button size="sm" color="failure" onClick={() => handleDelete(emp.employee_Id)}>
                      <Icon icon="solar:trash-bin-trash-linear" className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}

      {/* Form Modal */}
      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header>{editEmployee ? "Edit Employee" : "Add Employee"}</Modal.Header>
        <Modal.Body>
          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_Code" value="Employee Code" />
                <TextInput id="employee_Code" {...formik.getFieldProps("employee_Code")} />
              </div>
              <div>
                <Label htmlFor="employee_Username" value="Username" />
                <TextInput id="employee_Username" {...formik.getFieldProps("employee_Username")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_FristName" value="First Name" />
                <TextInput id="employee_FristName" {...formik.getFieldProps("employee_FristName")} />
              </div>
              <div>
                <Label htmlFor="employee_LastName" value="Last Name" />
                <TextInput id="employee_LastName" {...formik.getFieldProps("employee_LastName")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_Phone" value="Phone" />
                <TextInput id="employee_Phone" {...formik.getFieldProps("employee_Phone")} />
              </div>
              <div>
                <Label htmlFor="employee_Email" value="Email" />
                <TextInput id="employee_Email" {...formik.getFieldProps("employee_Email")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role_Id" value="Role" />
                <Select id="role_Id" {...formik.getFieldProps("role_Id")}>
                  {roles.map(r => <option key={r.role_Id} value={r.role_Id}>{r.role_Name}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="department_Id" value="Department" />
                <Select id="department_Id" {...formik.getFieldProps("department_Id")}>
                  {departments.map(d => <option key={d.department_Id} value={d.department_Id}>{d.department_Name}</option>)}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="employee_Password" value={editEmployee ? "Password (Leave blank to keep same)" : "Password"} />
              <TextInput id="employee_Password" type="password" {...formik.getFieldProps("employee_Password")} />
            </div>

            <div>
              <Label htmlFor="employee_Status" value="Status" />
              <Select id="employee_Status" {...formik.getFieldProps("employee_Status")}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting} color="primary" className="bg-primary hover:bg-primary/90 text-white">
            Save
          </Button>
          <Button color="gray" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

    </Card>
  );
};

export default Employees;
