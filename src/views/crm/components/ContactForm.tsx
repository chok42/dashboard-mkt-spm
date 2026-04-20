import React, { useEffect, useState } from "react";
import { Button, Label, TextInput, Textarea, Select, Spinner, Datepicker } from "flowbite-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { crmService } from "../../../services/api/crmService";
import { useAuth } from "../../../contexts/AuthContext";
import { ContactStatus, Platform, HospitalService } from "../../../types/crm.types";

interface ContactFormProps {
  editId: string | null;
  onClose: () => void;
  onSave: () => void;
  statuses: ContactStatus[];
  platforms: Platform[];
  servicesList: HospitalService[];
}

const validationSchema = Yup.object().shape({
  cusContact_FirstName: Yup.string().required("First Name is required"),
  cusContact_LastName: Yup.string().required("Last Name is required"),
  cusContact_Phone: Yup.string().required("Phone is required").min(9, "Phone must be at least 9 characters"),
  cusContact_Detail: Yup.string().required("Contact details are required"),
  cusContact_Date: Yup.date().required("Date is required"),
  conStatus_Id: Yup.string().required("Status is required"),
  platform_Id: Yup.string().required("Platform is required"),
  services: Yup.array().min(1, "Please select at least one service").required()
});

const ContactForm: React.FC<ContactFormProps> = ({ editId, onClose, onSave, statuses, platforms, servicesList }) => {
  const { user } = useAuth();
  const [loadingInitial, setLoadingInitial] = useState(false);

  const formik = useFormik({
    initialValues: {
      cusContact_FirstName: "",
      cusContact_MiddleName: "",
      cusContact_LastName: "",
      cusContact_Phone: "",
      cusContact_Detail: "",
      cusContact_Note: "",
      cusContact_Date: new Date().toISOString().split('T')[0],
      conStatus_Id: "",
      platform_Id: "",
      services: [] as string[]
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const toastId = toast.loading(editId ? "Updating contact..." : "Saving contact...");
      try {
        const payload = {
          cusContact_FirstName: values.cusContact_FirstName,
          cusContact_MiddleName: values.cusContact_MiddleName,
          cusContact_LastName: values.cusContact_LastName,
          cusContact_FullName: `${values.cusContact_FirstName} ${values.cusContact_MiddleName ? values.cusContact_MiddleName + ' ' : ''}${values.cusContact_LastName}`,
          cusContact_Phone: values.cusContact_Phone,
          cusContact_Detail: values.cusContact_Detail,
          cusContact_Note: values.cusContact_Note,
          cusContact_Date: new Date(values.cusContact_Date).toISOString(),
          conStatus_Id: values.conStatus_Id,
          conStatus_Name: statuses.find(s => s.conStatus_Id === values.conStatus_Id)?.conStatus_Name || "",
          platform_Id: values.platform_Id,
          platform_Name: platforms.find(p => p.platform_Id === values.platform_Id)?.platform_Name || "",
          employee_Id: user?.employee_Id || "SYSTEM",
          employee_FullName: user ? `${user.employee_FristName} ${user.employee_LastName}` : "SYSTEM"
        };

        if (editId) {
          await crmService.updateContact(editId, payload, values.services);
          toast.success("Contact updated successfully", { id: toastId });
        } else {
          await crmService.createContact(payload, values.services);
          toast.success("Contact created successfully", { id: toastId });
        }
        onSave();
      } catch (error) {
        console.error("Error saving contact", error);
        toast.error(`Failed to ${editId ? 'update' : 'create'} contact`, { id: toastId });
      } finally {
        setSubmitting(false);
      }
    }
  });

  useEffect(() => {
    if (editId) {
      setLoadingInitial(true);
      crmService.getContactById(editId).then(data => {
        if (data) {
          formik.setValues({
            cusContact_FirstName: data.contact.cusContact_FirstName,
            cusContact_MiddleName: data.contact.cusContact_MiddleName || "",
            cusContact_LastName: data.contact.cusContact_LastName,
            cusContact_Phone: data.contact.cusContact_Phone,
            cusContact_Detail: data.contact.cusContact_Detail,
            cusContact_Note: data.contact.cusContact_Note || "",
            cusContact_Date: new Date(data.contact.cusContact_Date).toISOString().split('T')[0],
            conStatus_Id: data.contact.conStatus_Id,
            platform_Id: data.contact.platform_Id,
            services: data.serviceIds
          });
        }
        setLoadingInitial(false);
      });
    }
  }, [editId]);

  const toggleService = (srvId: string) => {
    const s = formik.values.services;
    if (s.includes(srvId)) {
      formik.setFieldValue("services", s.filter(id => id !== srvId));
    } else {
      formik.setFieldValue("services", [...s, srvId]);
    }
  };

  if (loadingInitial) {
    return <div className="p-10 flex justify-center"><Spinner size="xl" /></div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {editId ? "Edit Customer Contact" : "Add Customer Contact"}
        </h3>
        <Button color="light" onClick={onClose} size="sm">Cancel</Button>
      </div>

      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="mb-2 block"><Label htmlFor="cusContact_FirstName" value="First Name *" /></div>
            <TextInput id="cusContact_FirstName" {...formik.getFieldProps("cusContact_FirstName")} />
            {formik.touched.cusContact_FirstName && formik.errors.cusContact_FirstName ? (
              <div className="text-red-500 text-sm">{formik.errors.cusContact_FirstName}</div>
            ) : null}
          </div>
          <div>
            <div className="mb-2 block"><Label htmlFor="cusContact_MiddleName" value="Middle Name" /></div>
            <TextInput id="cusContact_MiddleName" {...formik.getFieldProps("cusContact_MiddleName")} />
          </div>
          <div>
            <div className="mb-2 block"><Label htmlFor="cusContact_LastName" value="Last Name *" /></div>
            <TextInput id="cusContact_LastName" {...formik.getFieldProps("cusContact_LastName")} />
            {formik.touched.cusContact_LastName && formik.errors.cusContact_LastName ? (
              <div className="text-red-500 text-sm">{formik.errors.cusContact_LastName}</div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="mb-2 block"><Label htmlFor="cusContact_Phone" value="Phone Number *" /></div>
            <TextInput id="cusContact_Phone" {...formik.getFieldProps("cusContact_Phone")} />
            {formik.touched.cusContact_Phone && formik.errors.cusContact_Phone ? (
              <div className="text-red-500 text-sm">{formik.errors.cusContact_Phone}</div>
            ) : null}
          </div>
          <div>
            <div className="mb-2 block"><Label htmlFor="cusContact_Date" value="Contact Date *" /></div>
            <Datepicker 
              language="th-TH"
              labelTodayButton="วันนี้"
              labelClearButton="ล้าง"
              onChange={(date: Date | null) => formik.setFieldValue("cusContact_Date", date ? date.toISOString().split('T')[0] : "")}
              value={new Date(formik.values.cusContact_Date)}
            />
            {formik.touched.cusContact_Date && formik.errors.cusContact_Date ? (
              <div className="text-red-500 text-sm">{formik.errors.cusContact_Date as string}</div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="mb-2 block"><Label htmlFor="platform_Id" value="Platform *" /></div>
            <Select id="platform_Id" {...formik.getFieldProps("platform_Id")}>
              <option value="">Select Platform</option>
              {platforms.map(p => <option key={p.platform_Id} value={p.platform_Id}>{p.platform_Name}</option>)}
            </Select>
            {formik.touched.platform_Id && formik.errors.platform_Id ? (
              <div className="text-red-500 text-sm">{formik.errors.platform_Id}</div>
            ) : null}
          </div>
          <div>
            <div className="mb-2 block"><Label htmlFor="conStatus_Id" value="Status *" /></div>
            <Select id="conStatus_Id" {...formik.getFieldProps("conStatus_Id")}>
              <option value="">Select Status</option>
              {statuses.map(s => <option key={s.conStatus_Id} value={s.conStatus_Id}>{s.conStatus_Name}</option>)}
            </Select>
            {formik.touched.conStatus_Id && formik.errors.conStatus_Id ? (
              <div className="text-red-500 text-sm">{formik.errors.conStatus_Id}</div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="mb-2 block"><Label value="Interested Services *" /></div>
          <div className="flex flex-wrap gap-2">
            {servicesList.map(srv => {
              const isSelected = formik.values.services.includes(srv.hosService_Id);
              return (
                <Button
                  key={srv.hosService_Id}
                  type="button"
                  color={isSelected ? "success" : "light"}
                  onClick={() => toggleService(srv.hosService_Id)}
                  size="sm"
                >
                  {srv.hosService_Name}
                </Button>
              )
            })}
          </div>
          {formik.touched.services && formik.errors.services ? (
            <div className="text-red-500 text-sm mt-1">{formik.errors.services as string}</div>
          ) : null}
        </div>

        <div>
          <div className="mb-2 block"><Label htmlFor="cusContact_Detail" value="Contact Details *" /></div>
          <Textarea id="cusContact_Detail" {...formik.getFieldProps("cusContact_Detail")} rows={3} />
          {formik.touched.cusContact_Detail && formik.errors.cusContact_Detail ? (
            <div className="text-red-500 text-sm">{formik.errors.cusContact_Detail}</div>
          ) : null}
        </div>

        <div>
          <div className="mb-2 block"><Label htmlFor="cusContact_Note" value="Note" /></div>
          <Textarea id="cusContact_Note" {...formik.getFieldProps("cusContact_Note")} rows={2} />
        </div>

        <div className="flex justify-end gap-2 mt-4 border-t pt-4">
          <Button color="light" onClick={onClose} disabled={formik.isSubmitting}>Cancel</Button>
          <Button type="submit" color="primary" disabled={formik.isSubmitting} className="bg-primary text-white">
            {formik.isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
            {editId ? "Update Contact" : "Save Contact"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
