import { useEffect, useState, useCallback } from "react";
import { Button, Table, Card, Spinner, Modal, TextInput, Label } from "flowbite-react";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { crmService } from "../../services/api/crmService";
import { Platform } from "../../types/crm.types";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../contexts/AuthContext";

const Platforms = () => {
  const { role } = useAuth();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPlatform, setEditPlatform] = useState<Platform | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await crmService.getPlatforms();
      setPlatforms(result || []);
    } catch (error) {
      console.error("Failed to load platforms", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddNew = () => {
    setEditPlatform(null);
    formik.resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (platform: Platform) => {
    setEditPlatform(platform);
    formik.setValues({
      platform_Name: platform.platform_Name
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This platform will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        await crmService.deletePlatform(id);
        toast.success("Platform deleted successfully");
        loadData();
      } catch (error) {
        toast.error("Failed to delete platform");
      }
    }
  };

  const formik = useFormik({
    initialValues: {
      platform_Name: "",
    },
    validationSchema: Yup.object({
      platform_Name: Yup.string().required("Platform Name is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      const toastId = toast.loading(editPlatform ? "Updating platform..." : "Creating platform...");
      try {
        if (editPlatform) {
          await crmService.updatePlatform(editPlatform.platform_Id, values);
          toast.success("Platform updated successfully", { id: toastId });
        } else {
          await crmService.createPlatform(values);
          toast.success("Platform created successfully", { id: toastId });
        }
        setIsModalOpen(false);
        loadData();
      } catch (e) {
        console.error(e);
        toast.error("Failed to save platform.", { id: toastId });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Card className="shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Manage Platforms
        </h5>
        {role === "R99" && (
          <Button onClick={handleAddNew} color="primary" className="bg-primary hover:bg-primary/90 text-white">
            <Icon icon="solar:add-circle-outline" className="mr-2 h-5 w-5" />
            Add Platform
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Spinner size="xl" /></div>
      ) : (
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>ID</Table.HeadCell>
              <Table.HeadCell>Platform Name</Table.HeadCell>
              {role === "R99" && (
                <Table.HeadCell>
                  <span className="sr-only">Actions</span>
                </Table.HeadCell>
              )}
            </Table.Head>
            <Table.Body className="divide-y">
              {platforms.map((platform) => (
                <Table.Row key={platform.platform_Id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">
                    {platform.platform_Id}
                  </Table.Cell>
                  <Table.Cell>{platform.platform_Name}</Table.Cell>
                  {role === "R99" && (
                    <Table.Cell className="flex gap-2 justify-end">
                      <Button size="sm" color="light" onClick={() => handleEdit(platform)}>
                        <Icon icon="solar:pen-new-round-linear" className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button size="sm" color="failure" onClick={() => handleDelete(platform.platform_Id)}>
                        <Icon icon="solar:trash-bin-trash-linear" className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))}
              {platforms.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={3} className="text-center py-4 text-gray-500">No platforms found</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      )}

      {/* Form Modal */}
      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header>{editPlatform ? "Edit Platform" : "Add Platform"}</Modal.Header>
        <Modal.Body>
          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="platform_Name" value="Platform Name" />
              </div>
              <TextInput
                id="platform_Name"
                name="platform_Name"
                type="text"
                placeholder="e.g. Line OA, Facebook..."
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.platform_Name}
                color={formik.touched.platform_Name && formik.errors.platform_Name ? "failure" : "gray"}
                helperText={formik.touched.platform_Name && formik.errors.platform_Name ? formik.errors.platform_Name : null}
              />
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

export default Platforms;
