import React, { useEffect, useState, useCallback } from "react";
import { Button, Table, Badge, Card, Spinner, Modal, TextInput, Select, Pagination } from "flowbite-react";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { crmService, ContactFilters } from "../../services/api/crmService";
import { CustomerContact, ContactStatus, Platform, HospitalService } from "../../types/crm.types";
import ContactForm from "./components/ContactForm";
import ContactImportModal from "./components/ContactImportModal";
import { useAuth } from "../../contexts/AuthContext";
import { toThaiDateString } from "src/helpers/format";

const CustomerContacts = () => {
  const { user, role } = useAuth();
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [statuses, setStatuses] = useState<ContactStatus[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [hospitalServices, setHospitalServices] = useState<HospitalService[]>([]);

  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewContact, setViewContact] = useState<CustomerContact | null>(null);
  const [viewServices, setViewServices] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filtering & Pagination State
  const [filters, setFilters] = useState<ContactFilters>({
    search: "",
    platformId: "",
    statusId: "",
    serviceId: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10
  });

  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadReferenceData = async () => {
    try {
      const [fetchedStatuses, fetchedPlatforms, fetchedServices] = await Promise.all([
        crmService.getStatuses(),
        crmService.getPlatforms(),
        crmService.getHospitalServices()
      ]);
      setStatuses(fetchedStatuses);
      setPlatforms(fetchedPlatforms);
      setHospitalServices(fetchedServices);
    } catch (error) {
      console.error("Failed to load reference CRM data", error);
    }
  };

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await crmService.getContacts(filters);
      setContacts(result.items);
      setTotalPages(result.total_pages > 0 ? result.total_pages : 1);
      setTotalCount(result.total_count);
    } catch (error) {
      console.error("Failed to load contacts data", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const onPageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleAddNew = () => {
    setEditId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this contact!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        await crmService.deleteContact(id);
        toast.success("Contact deleted successfully");
        loadContacts();
      } catch (error) {
        toast.error("Failed to delete contact");
      }
    }
  };

  const handleHide = async (id: string) => {
    const result = await Swal.fire({
      title: "Hide contact?",
      text: "This contact will be hidden from the active list.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f39c12",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, hide it!"
    });

    if (result.isConfirmed) {
      try {
        await crmService.hideContact(id);
        toast.success("Contact hidden successfully");
        loadContacts();
      } catch (error) {
        toast.error("Failed to hide contact");
      }
    }
  };

  const handeFormSaved = () => {
    setIsFormOpen(false);
    loadContacts();
  };

  const handleView = async (id: string) => {
    const data = await crmService.getContactById(id);
    if (data) {
      setViewContact(data.contact);
      setViewServices(data.serviceIds);
    }
  };

  const handleExportCSV = () => {
    if (contacts.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "ID", "Name", "Phone", "Status", "Platform",
      "Date", "Details", "Notes", "Employee ID"
    ];

    const csvRows = [headers.join(",")];

    contacts.forEach(c => {
      const row = [
        c.cusContact_Id,
        `"${c.cusContact_FullName}"`,
        `"${c.cusContact_Phone}"`,
        `"${getStatusName(c.conStatus_Id)}"`,
        `"${getPlatformName(c.platform_Id)}"`,
        c.cusContact_Date,
        `"${(c.cusContact_Detail || "").replace(/"/g, '""')}"`,
        `"${(c.cusContact_Note || "").replace(/"/g, '""')}"`,
        c.employee_Id
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Customer_Contacts_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusName = (id: string) => statuses.find(s => s.conStatus_Id === id)?.conStatus_Name || id;
  const getPlatformName = (id: string) => platforms.find(p => p.platform_Id === id)?.platform_Name || id;

  if (isFormOpen) {
    return (
      <Card className="shadow-md">
        <ContactForm
          editId={editId}
          onClose={() => setIsFormOpen(false)}
          onSave={handeFormSaved}
          statuses={statuses}
          platforms={platforms}
          servicesList={hospitalServices}
        />
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Customer Contacts
        </h5>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} color="success" className="bg-green-600 hover:bg-green-700 text-white">
            <Icon icon="solar:download-square-outline" className="mr-2 h-5 w-5" />
            Export CSV
          </Button>
          {(role === "R99" || role === "R01") && (
            <>
              <Button onClick={() => setIsImportModalOpen(true)} color="info" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Icon icon="solar:file-send-outline" className="mr-2 h-5 w-5" />
                Import Excel
              </Button>
              <Button onClick={handleAddNew} color="primary" className="bg-primary hover:bg-primary/90 text-white">
                <Icon icon="solar:add-circle-outline" className="mr-2 h-5 w-5" />
                Add Contact
              </Button>
            </>
          )}
        </div>
      </div>

      {/* TopBar Filters */}
      <div className="w-full flex flex-col gap-2 mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <TextInput
            name="search"
            placeholder="Search Name or Phone..."
            value={filters.search}
            onChange={handleFilterChange}
            className="lg:col-span-2"
            icon={() => <Icon icon="solar:magnifer-linear" className="h-4 w-4 text-gray-500" />}
          />
          <Select name="platformId" value={filters.platformId} onChange={handleFilterChange}>
            <option value="">All Platforms</option>
            {platforms.map(p => <option key={p.platform_Id} value={p.platform_Id}>{p.platform_Name}</option>)}
          </Select>
          <Select name="statusId" value={filters.statusId} onChange={handleFilterChange}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s.conStatus_Id} value={s.conStatus_Id}>{s.conStatus_Name}</option>)}
          </Select>
          <Select name="serviceId" value={filters.serviceId} onChange={handleFilterChange}>
            <option value="">All Services</option>
            {hospitalServices.map(s => <option key={s.hosService_Id} value={s.hosService_Id}>{s.hosService_Name}</option>)}
          </Select>


        </div>
        <div className="flex gap-2">
          <TextInput
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
            title="Start Date"
          />
          <TextInput
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
            title="End Date"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Spinner size="xl" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Name</Table.HeadCell>
                <Table.HeadCell>Phone</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
                <Table.HeadCell>Platform</Table.HeadCell>
                <Table.HeadCell>Date</Table.HeadCell>
                <Table.HeadCell>
                  <span className="sr-only">Actions</span>
                </Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {contacts.map((contact) => (
                  <Table.Row key={contact.cusContact_Id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {contact.cusContact_FullName}
                    </Table.Cell>
                    <Table.Cell>{contact.cusContact_Phone}</Table.Cell>
                    <Table.Cell>
                      <Badge color="info" className="inline-flex">{getStatusName(contact.conStatus_Id)}</Badge>
                    </Table.Cell>
                    <Table.Cell>{getPlatformName(contact.platform_Id)}</Table.Cell>
                    <Table.Cell>{toThaiDateString(contact.cusContact_Date)}</Table.Cell>
                    <Table.Cell className="flex gap-2">
                      <Button size="sm" color="info" onClick={() => handleView(contact.cusContact_Id)}>
                        View
                      </Button>
                      {(role === "R99" || (role === "R01" && contact.employee_Id === user?.employee_Id)) && (
                        <>
                          <Button size="sm" color="light" onClick={() => handleEdit(contact.cusContact_Id)}>
                            Edit
                          </Button>
                          <Button size="sm" color="warning" onClick={() => handleHide(contact.cusContact_Id)}>
                            Hide
                          </Button>
                          <Button size="sm" color="failure" onClick={() => handleDelete(contact.cusContact_Id)}>
                            Del
                          </Button>
                        </>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
                {contacts.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={6} className="text-center py-4 text-gray-500">No contacts found matching criteria</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">Showing {contacts.length} of {totalCount} entries</p>
            <Pagination
              currentPage={filters.page || 1}
              totalPages={totalPages}
              onPageChange={onPageChange}
              showIcons
            />
          </div>
        </>
      )}

      {/* View Contact Modal */}
      <Modal show={viewContact !== null} onClose={() => setViewContact(null)}>
        <Modal.Header>Contact Details</Modal.Header>
        <Modal.Body>
          {viewContact && (
            <div className="space-y-4">
              <p><strong>Name:</strong> {viewContact.cusContact_FullName}</p>
              <p><strong>Phone:</strong> {viewContact.cusContact_Phone}</p>
              <p><strong>Date:</strong> {toThaiDateString(viewContact.cusContact_Date)}</p>
              <p><strong>Status:</strong> {getStatusName(viewContact.conStatus_Id)}</p>
              <p><strong>Platform:</strong> {getPlatformName(viewContact.platform_Id)}</p>
              <p><strong>Details:</strong> {viewContact.cusContact_Detail}</p>
              {viewContact.cusContact_Note && <p><strong>Note:</strong> {viewContact.cusContact_Note}</p>}

              <div className="pt-2">
                <p className="font-bold mb-2">Interested Services:</p>
                <div className="flex flex-wrap gap-2">
                  {viewServices.map(srvId => {
                    const srv = hospitalServices.find(s => s.hosService_Id === srvId);
                    return <Badge key={srvId} color="success">{srv?.hosService_Name || srvId}</Badge>;
                  })}
                  {viewServices.length === 0 && <span className="text-gray-500">No specific services</span>}
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-4 border-t pt-2">Added by Employee ID: {viewContact.employee_Id}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setViewContact(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
      
      <ContactImportModal
        show={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={loadContacts}
        statuses={statuses}
        platforms={platforms}
        services={hospitalServices}
      />

    </Card>
  );
};

export default CustomerContacts;
