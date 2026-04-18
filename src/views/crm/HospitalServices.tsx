import { useEffect, useState, useCallback } from "react";
import { Button, Table, Card, Spinner, Modal, TextInput, Label, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { crmService } from "../../services/api/crmService";
import { HospitalService } from "../../types/crm.types";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../contexts/AuthContext";

const HospitalServices = () => {
  const { role } = useAuth();
  const [services, setServices] = useState<HospitalService[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editService, setEditService] = useState<HospitalService | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await crmService.getHospitalServices();
      setServices(result || []);
    } catch (error) {
      console.error("Failed to load hospital services", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddNew = () => {
    setEditService(null);
    formik.resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (service: HospitalService) => {
    setEditService(service);
    formik.setValues({
      hosService_Code: service.hosService_Code,
      hosService_Name: service.hosService_Name,
      hosService_Description: service.hosService_Description,
      hosService_IsShow: service.hosService_IsShow || "Y",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This hospital service will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        await crmService.deleteHospitalService(id);
        toast.success("Service deleted successfully");
        loadData();
      } catch (error) {
        toast.error("Failed to delete service");
      }
    }
  };

  const formik = useFormik({
    initialValues: {
      hosService_Code: "",
      hosService_Name: "",
      hosService_Description: "",
      hosService_IsShow: "Y",
    },
    validationSchema: Yup.object({
      hosService_Code: Yup.string().required("Service Code is required"),
      hosService_Name: Yup.string().required("Service Name is required"),
      hosService_Description: Yup.string(),
      hosService_IsShow: Yup.string().required()
    }),
    onSubmit: async (values, { setSubmitting }) => {
      const toastId = toast.loading(editService ? "Updating service..." : "Creating service...");
      try {
        if (editService) {
          await crmService.updateHospitalService(editService.hosService_Id, values);
          toast.success("Service updated successfully", { id: toastId });
        } else {
          await crmService.createHospitalService(values);
          toast.success("Service created successfully", { id: toastId });
        }
        setIsModalOpen(false);
        loadData();
      } catch (e) {
        console.error(e);
        toast.error("Failed to save service.", { id: toastId });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Card className="shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Manage Hospital Services
        </h5>
        {role === "R99" && (
          <Button onClick={handleAddNew} color="primary" className="bg-primary hover:bg-primary/90 text-white">
            <Icon icon="solar:add-circle-outline" className="mr-2 h-5 w-5" />
            Add Service
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Spinner size="xl" /></div>
      ) : (
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Code</Table.HeadCell>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Description</Table.HeadCell>
              <Table.HeadCell>Visibility</Table.HeadCell>
              {role === "R99" && (
                <Table.HeadCell>
                  <span className="sr-only">Actions</span>
                </Table.HeadCell>
              )}
            </Table.Head>
            <Table.Body className="divide-y">
              {services.map((service) => (
                <Table.Row key={service.hosService_Id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">
                    {service.hosService_Code}
                  </Table.Cell>
                  <Table.Cell>{service.hosService_Name}</Table.Cell>
                  <Table.Cell>{service.hosService_Description}</Table.Cell>
                  <Table.Cell>
                    {service.hosService_IsShow === 'Y' ? (
                      <span className="text-green-500 font-semibold">Show</span>
                    ) : (
                      <span className="text-gray-500">Hidden</span>
                    )}
                  </Table.Cell>
                  {role === "R99" && (
                    <Table.Cell className="flex gap-2 justify-end">
                      <Button size="sm" color="light" onClick={() => handleEdit(service)}>
                        <Icon icon="solar:pen-new-round-linear" className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button size="sm" color="failure" onClick={() => handleDelete(service.hosService_Id)}>
                        <Icon icon="solar:trash-bin-trash-linear" className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))}
              {services.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center py-4 text-gray-500">No services found</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      )}

      {/* Form Modal */}
      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header>{editService ? "Edit Service" : "Add Service"}</Modal.Header>
        <Modal.Body>
          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="hosService_Code" value="Service Code" />
              </div>
              <TextInput
                id="hosService_Code"
                name="hosService_Code"
                type="text"
                placeholder="e.g. SRV-01"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.hosService_Code}
                color={formik.touched.hosService_Code && formik.errors.hosService_Code ? "failure" : "gray"}
                helperText={formik.touched.hosService_Code && formik.errors.hosService_Code ? formik.errors.hosService_Code : null}
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="hosService_Name" value="Service Name" />
              </div>
              <TextInput
                id="hosService_Name"
                name="hosService_Name"
                type="text"
                placeholder="Service Display Name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.hosService_Name}
                color={formik.touched.hosService_Name && formik.errors.hosService_Name ? "failure" : "gray"}
                helperText={formik.touched.hosService_Name && formik.errors.hosService_Name ? formik.errors.hosService_Name : null}
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="hosService_Description" value="Description" />
              </div>
              <TextInput
                id="hosService_Description"
                name="hosService_Description"
                type="text"
                placeholder="Short Description..."
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.hosService_Description}
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="hosService_IsShow" value="Visibility" />
              </div>
              <Select
                id="hosService_IsShow"
                name="hosService_IsShow"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.hosService_IsShow}
              >
                <option value="Y">Show in App</option>
                <option value="N">Hidden</option>
              </Select>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting} color="primary" className="bg-primary hover:bg-primary/90 text-white">
            {formik.isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
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

export default HospitalServices;
