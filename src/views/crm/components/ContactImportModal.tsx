import React, { useState, useRef } from "react";
import { Modal, Button, Table, Spinner, Badge, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { ContactStatus, Platform, HospitalService, CustomerContact } from "../../../types/crm.types";
import { useAuth } from "../../../contexts/AuthContext";
import { crmService } from "../../../services/api/crmService";
import { format } from 'date-fns'

interface ContactImportModalProps {
  show: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  statuses: ContactStatus[];
  platforms: Platform[];
  services: HospitalService[];
}

interface ImportRow {
  "Full Name": string;
  "Phone": string;
  "Platform"?: string;
  "Status"?: string;
  "Date"?: string;
  "Details"?: string;
  "Notes"?: string;
  "Services"?: string;
}

interface ValidatedRow {
  contact: Omit<CustomerContact, "cusContact_Id" | "cusContact_CreationDate">;
  serviceIds: string[];
  original: ImportRow;
  errors: string[];
}

const ContactImportModal: React.FC<ContactImportModalProps> = ({
  show,
  onClose,
  onImportSuccess,
  statuses,
  platforms,
  services,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validatedData, setValidatedData] = useState<ValidatedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setValidatedData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ImportRow>(worksheet);
        validateData(jsonData);

      } catch (err) {
        console.error("Error parsing Excel:", err);
        setError("Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = (rows: ImportRow[]) => {
    const results: ValidatedRow[] = rows.map((row) => {
      const errors: string[] = [];
      const fullName = row["Full Name"]?.toString().trim() || "";
      const phone = row["Phone"]?.toString().trim() || "";

      if (!fullName) errors.push("Missing Full Name");
      if (!phone) errors.push("Missing Phone");

      // Map Platform
      const platformName = row["Platform"]?.toString().trim();
      const platform = platforms.find(
        (p) =>
          p.platform_Name.toLowerCase() === platformName?.toLowerCase() ||
          p.platform_Id === platformName
      );
      if (platformName && !platform) errors.push(`Unknown Platform: ${platformName}`);

      // Map Status
      const statusName = row["Status"]?.toString().trim();
      const status = statuses.find(
        (s) =>
          s.conStatus_Name.toLowerCase() === statusName?.toLowerCase() ||
          s.conStatus_Id === statusName
      );
      if (statusName && !status) errors.push(`Unknown Status: ${statusName}`);

      // Map Services
      const serviceNames = row["Services"]?.toString().split(",").map(s => s.trim()) || [];
      const foundServiceIds: string[] = [];
      serviceNames.forEach(name => {
        if (!name) return;
        const srv = services.find(
          (s) =>
            s.hosService_Name.toLowerCase() === name.toLowerCase() ||
            s.hosService_Id === name
        );
        if (srv) {
          foundServiceIds.push(srv.hosService_Id);
        } else {
          errors.push(`Unknown Service: ${name}`);
        }
      });

      // Date parsing
      // let contactDate = new Date().toISOString().split("T")[0];
      // if (row["Date"]) {
      //   const d = new Date(row["Date"]);
      //   if (!isNaN(d.getTime())) {
      //     contactDate = d.toISOString().split("T")[0];
      //   } else {
      //     errors.push(`Invalid Date: ${row["Date"]}`);
      //   }
      // }
      // console.log('row["Date"]', row["Date"]);

      let contactDate = "";
      if (row["Date"]) {
        contactDate = format(new Date(row["Date"]), 'dd/MM/yyyy');
      }
      console.log('contactDate', contactDate);

      return {
        contact: {
          cusContact_FullName: fullName,
          cusContact_FirstName: fullName.split(" ")[0] || "",
          cusContact_MiddleName: "",
          cusContact_LastName: fullName.split(" ").slice(1).join(" ") || "",
          cusContact_Phone: phone,
          cusContact_Detail: row["Details"]?.toString() || "",
          cusContact_Note: row["Notes"]?.toString() || "",
          cusContact_Date: contactDate || "",
          conStatus_Id: status?.conStatus_Id || statuses[0]?.conStatus_Id || "Unknown",
          conStatus_Name: status?.conStatus_Name || statuses[0]?.conStatus_Name || "Unknown",
          platform_Id: platform?.platform_Id || platforms[0]?.platform_Id || "Unknown",
          platform_Name: platform?.platform_Name || platforms[0]?.platform_Name || "Unknown",
          employee_Id: user?.employee_Id || "SYSTEM",
          employee_FullName: user ? `${user.employee_FristName} ${user.employee_LastName}` : "SYSTEM",
        },
        serviceIds: foundServiceIds,
        original: row,
        errors,
      };
    });

    setValidatedData(results);
  };

  const handleImport = async () => {
    if (validatedData.some(r => r.errors.length > 0)) {
      const result = await Swal.fire({
        title: "Rows with errors detected",
        text: "Some rows have errors and will be imported with default values or incomplete data. Proceed anyway?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, import anyway"
      });

      if (!result.isConfirmed) return;
    }

    setImporting(true);
    const toastId = toast.loading("Importing contacts...");
    try {
      const dataToImport = validatedData.map(r => ({
        contact: r.contact,
        serviceIds: r.serviceIds
      }));

      console.log('data Import:', dataToImport);
      await crmService.bulkCreateContacts(dataToImport);
      toast.success(`Successfully imported ${dataToImport.length} contacts`, { id: toastId });
      onImportSuccess();
      onClose();
    } catch (err) {
      console.error("Bulk import failed:", err);
      toast.error("Failed to import data. Please try again.", { id: toastId });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setValidatedData([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Modal show={show} onClose={onClose} size="4xl">
      <Modal.Header>Import Contacts from Excel</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <h6 className="font-bold mb-1">Standard Excel Format:</h6>
            <p>Columns: <strong>Full Name, Phone, Platform, Status, Date, Services, Details, Notes</strong></p>
            <p className="mt-1 text-xs">* Platform, Status, and Services should match existing items in the CRM system.</p>
          </div>

          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Icon icon="solar:file-send-outline" className="h-12 w-12 text-gray-400 mb-2" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400">XLSX, XLS or CSV (MAX. 5MB)</p>
            <Button color="light" size="sm" className="mt-4" onClick={() => fileInputRef.current?.click()} disabled={loading}>
              Select File
            </Button>
          </div>

          {error && <Alert color="failure">{error}</Alert>}

          {loading && (
            <div className="flex justify-center py-4">
              <Spinner size="lg" />
              <span className="ml-3">Processing file...</span>
            </div>
          )}

          {validatedData.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h6 className="font-semibold">Review Data ({validatedData.length} records)</h6>
                {validatedData.some(r => r.errors.length > 0) && (
                  <Badge color="warning">Action Needed: {validatedData.filter(r => r.errors.length > 0).length} records with issues</Badge>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <Table hoverable striped>
                  <Table.Head>
                    <Table.HeadCell>Full Name</Table.HeadCell>
                    <Table.HeadCell>Phone</Table.HeadCell>
                    <Table.HeadCell>Status</Table.HeadCell>
                    <Table.HeadCell>Issues</Table.HeadCell>
                  </Table.Head>
                  <Table.Body className="divide-y">
                    {validatedData.map((row, idx) => (
                      <Table.Row key={idx} className={row.errors.length > 0 ? "bg-red-50 dark:bg-red-900/10" : ""}>
                        <Table.Cell className="whitespace-nowrap font-medium">
                          {row.contact.cusContact_FullName}
                        </Table.Cell>
                        <Table.Cell>{row.contact.cusContact_Phone}</Table.Cell>
                        <Table.Cell>
                          {row.original["Status"] || "Default"}
                        </Table.Cell>
                        <Table.Cell>
                          {row.errors.length > 0 ? (
                            <div className="text-xs text-red-600">
                              {row.errors.map((e, i) => <div key={i}>• {e}</div>)}
                            </div>
                          ) : (
                            <Badge color="success">OK</Badge>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-between w-full">
          <Button color="gray" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <div className="flex gap-2">
            <Button color="light" onClick={reset} disabled={validatedData.length === 0 || importing}>Clear</Button>
            <Button
              onClick={handleImport}
              disabled={validatedData.length === 0 || importing}
              className="bg-primary"
            >
              {importing ? <><Spinner size="sm" className="mr-2" /> Importing...</> : "Import All"}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ContactImportModal;
