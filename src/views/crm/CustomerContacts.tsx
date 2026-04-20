import { Button, Table, Badge, Card, Spinner, Modal, TextInput, Select, Pagination, Dropdown, Checkbox, Label, ButtonGroup, Datepicker } from "flowbite-react";
import { Icon } from "@iconify/react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { crmService, ContactFilters, ContactReport } from "../../services/api/crmService";
import { CustomerContact, ContactStatus, Platform, HospitalService } from "../../types/crm.types";
import ContactForm from "./components/ContactForm";
import ContactImportModal from "./components/ContactImportModal";
import CustomerAnalytics from "./components/CustomerAnalytics";
import { useAuth } from "../../contexts/AuthContext";
import { toThaiDateNumericString } from "src/helpers/format";
import { useCallback, useEffect, useState } from "react";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
  const [allContacts, setAllContacts] = useState<CustomerContact[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [report, setReport] = useState<ContactReport | null>(null);

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
      setSelectedIds([]); // Clear selection on reload
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

  useEffect(() => {
    if (viewMode === 'dashboard') {
      const fetchAll = async () => {
        setLoadingAll(true);
        try {
          const [data, reportData] = await Promise.all([
            crmService.getAllContacts(filters),
            crmService.getContactReport()
          ]);
          setAllContacts(data);
          setReport(reportData);
        } catch (error) {
          console.error("Failed to load data for dashboard", error);
        } finally {
          setLoadingAll(false);
        }
      };
      fetchAll();
    }
  }, [viewMode, filters.startDate, filters.endDate, filters.platformId, filters.statusId, filters.serviceId]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    const value = date ? date.toISOString().split('T')[0] : "";
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const onPageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSort = (column: 'date' | 'name') => {
    setFilters(prev => {
      const isAsc = prev.sortBy === column && prev.sortOrder === 'asc';
      return {
        ...prev,
        sortBy: column,
        sortOrder: isAsc ? 'desc' : 'asc',
        page: 1
      };
    });
  };

  const getSortIcon = (column: 'date' | 'name') => {
    if (filters.sortBy !== column) return <Icon icon="solar:sort-vertical-line-duotone" className="ml-1 opacity-20 h-4 w-4" />;
    return filters.sortOrder === 'asc'
      ? <Icon icon="solar:sort-from-bottom-to-top-line-duotone" className="ml-1 text-primary h-4 w-4" />
      : <Icon icon="solar:sort-from-top-to-bottom-line-duotone" className="ml-1 text-primary h-4 w-4" />;
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map(c => c.cusContact_Id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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

  const handleExportExcel = async (isAll = false) => {
    try {
      let dataToExport: CustomerContact[] = [];
      if (isAll) {
        setLoading(true);
        dataToExport = await crmService.getAllContacts(filters);
        setLoading(false);
      } else {
        dataToExport = selectedIds.length > 0
          ? contacts.filter(c => selectedIds.includes(c.cusContact_Id))
          : contacts;
      }

      if (dataToExport.length === 0) {
        toast.error("No data to export");
        return;
      }

      const worksheetData = dataToExport.map(c => ({
        "ID": c.cusContact_Id,
        "Full Name": c.cusContact_FullName,
        "Phone": c.cusContact_Phone,
        "Status": c.conStatus_Name,
        "Platform": c.platform_Name,
        "Date": toThaiDateNumericString(c.cusContact_Date),
        "Added By": c.employee_FullName,
        "Detail": c.cusContact_Detail,
        "Note": c.cusContact_Note || ""
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
      XLSX.writeFile(workbook, `Contacts_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel exported successfully");
    } catch (error) {
      toast.error("Failed to export Excel");
      setLoading(false);
    }
  };

  // const handleExportPDF = async () => {
  //   // Basic implementation using window.print as jspdf is not available/configured for advanced layouts yet
  //   // In a real scenario, we'd use jspdf-autotable here.
  //   Swal.fire({
  //     title: "PDF Export",
  //     text: "Generating PDF snapshot of current view...",
  //     icon: "info",
  //     timer: 1500,
  //     showConfirmButton: false
  //   });
  //   window.print();
  // };

  // const getStatusName = (id: string) => statuses.find(s => s.conStatus_Id === id)?.conStatus_Name || id;
  // const getPlatformName = (id: string) => platforms.find(p => p.platform_Id === id)?.platform_Name || id;
  // const getEmployeeName = (id: string) => {
  //   const emp = employees.find(e => e.employee_Id === id);
  //   return emp ? `${emp.employee_FristName} ${emp.employee_LastName}` : id;
  // };

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
        <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <Icon icon="solar:users-group-rounded-bold-duotone" className="text-primary w-6 h-6" />
          Customer Contacts
        </h5>
        <div className="flex gap-2 flex-wrap justify-end">
          <ButtonGroup className="mr-2">
            <Button size="sm" color={viewMode === 'list' ? 'info' : 'gray'} onClick={() => setViewMode('list')}>
              <Icon icon="solar:list-bold" className="mr-2 h-4 w-4" />
              List
            </Button>
            <Button size="sm" color={viewMode === 'dashboard' ? 'info' : 'gray'} onClick={() => setViewMode('dashboard')}>
              <Icon icon="solar:chart-square-bold" className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </ButtonGroup>

          <Dropdown label="Export" color="success" className="bg-green-600 hover:bg-green-700 text-white" size="sm">
            <Dropdown.Item onClick={() => handleExportExcel(false)}>
              <Icon icon="solar:file-download-outline" className="mr-2 h-4 w-4" />
              Export Selected (Excel)
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleExportExcel(true)}>
              <Icon icon="solar:download-square-outline" className="mr-2 h-4 w-4" />
              Export All (Excel)
            </Dropdown.Item>
            {/* <Dropdown.Item onClick={handleExportPDF}>
              <Icon icon="solar:file-corrupted-outline" className="mr-2 h-4 w-4" />
              Export PDF
            </Dropdown.Item> */}
          </Dropdown>

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
      <div className="w-full flex flex-col gap-2 p-4">
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
            <option value="">ช่องทาง</option>
            {platforms.map(p => <option key={p.platform_Id} value={p.platform_Id}>{p.platform_Name}</option>)}
          </Select>
          <Select name="statusId" value={filters.statusId} onChange={handleFilterChange}>
            <option value="">สถานะ</option>
            {statuses.map(s => <option key={s.conStatus_Id} value={s.conStatus_Id}>{s.conStatus_Name}</option>)}
          </Select>
          <Select name="serviceId" value={filters.serviceId} onChange={handleFilterChange}>
            <option value="">บริการ</option>
            {hospitalServices.map(s => <option key={s.hosService_Id} value={s.hosService_Id}>{s.hosService_Name}</option>)}
          </Select>

        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <Datepicker 
              language="th-TH"
              labelTodayButton="วันนี้"
              labelClearButton="ล้าง"
              onChange={(date) => handleDateChange('startDate', date)}
              value={filters.startDate ? new Date(filters.startDate) : undefined}
            />
          </div>
          <div className="flex-1">
            <Datepicker 
              language="th-TH"
              labelTodayButton="วันนี้"
              labelClearButton="ล้าง"
              onChange={(date) => handleDateChange('endDate', date)}
              value={filters.endDate ? new Date(filters.endDate) : undefined}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="pageSize" value="จำนวนต่อหน้า:" className="hidden lg:block whitespace-nowrap" />
          <Select name="limit" value={filters.limit} onChange={handleFilterChange} id="pageSize">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={9999}>ทั้งหมด</option>
          </Select>
        </div>
      </div>

      {viewMode === 'dashboard' ? (
        loadingAll ? (
          <div className="flex justify-center p-10"><Spinner size="xl" /></div>
        ) : (
          <CustomerAnalytics
            contacts={allContacts}
            platforms={platforms}
            statuses={statuses}
            services={hospitalServices}
            report={report}
          />
        )
      ) : (
        loading ? (
          <div className="flex justify-center p-10"><Spinner size="xl" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table hoverable>
                <Table.Head>
                  <Table.HeadCell className="p-4">
                    <Checkbox checked={selectedIds.length === contacts.length && contacts.length > 0} onChange={toggleSelectAll} />
                  </Table.HeadCell>
                  <Table.HeadCell className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      ชื่อ {getSortIcon('name')}
                    </div>
                  </Table.HeadCell>
                  <Table.HeadCell>เบอร์โทร</Table.HeadCell>
                  <Table.HeadCell>สถานะ</Table.HeadCell>
                  <Table.HeadCell>ช่องทาง</Table.HeadCell>
                  <Table.HeadCell className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('date')}>
                    <div className="flex items-center">
                      วันที่ {getSortIcon('date')}
                    </div>
                  </Table.HeadCell>
                  <Table.HeadCell>ผู้เพิ่ม</Table.HeadCell>
                  <Table.HeadCell>จัดการ</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {contacts.map((contact) => (
                    <Table.Row key={contact.cusContact_Id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="p-4">
                        <Checkbox checked={selectedIds.includes(contact.cusContact_Id)} onChange={() => toggleSelect(contact.cusContact_Id)} />
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {contact.cusContact_FullName}
                      </Table.Cell>
                      <Table.Cell>{contact.cusContact_Phone}</Table.Cell>
                      <Table.Cell>
                        <Badge color="info" className="inline-flex">{contact.conStatus_Name}</Badge>
                      </Table.Cell>
                      <Table.Cell>{contact.platform_Name}</Table.Cell>
                      <Table.Cell>{toThaiDateNumericString(contact.cusContact_Date)}</Table.Cell>
                      <Table.Cell>{contact.employee_FullName}</Table.Cell>
                      <Table.Cell>
                        <Dropdown label={<Icon icon="solar:menu-dots-bold" />} inline arrowIcon={false}>
                          <Dropdown.Item onClick={() => handleView(contact.cusContact_Id)}>
                            <Icon icon="solar:eye-outline" className="mr-2 h-4 w-4 text-blue-500" />
                            View Details
                          </Dropdown.Item>
                          {(role === "R99" || (role === "R01" && contact.employee_Id === user?.employee_Id)) && (
                            <>
                              <Dropdown.Item onClick={() => handleEdit(contact.cusContact_Id)}>
                                <Icon icon="solar:pen-new-square-outline" className="mr-2 h-4 w-4 text-gray-500" />
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleHide(contact.cusContact_Id)}>
                                <Icon icon="garden:eye-hide-fill-16" className="mr-2 h-4 w-4 text-yellow-500" />
                                Hide
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item onClick={() => handleDelete(contact.cusContact_Id)} className="text-red-600">
                                <Icon icon="solar:trash-bin-trash-outline" className="mr-2 h-4 w-4" />
                                Delete
                              </Dropdown.Item>
                            </>
                          )}
                        </Dropdown>
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
        )
      )}

      {/* View Contact Modal */}
      <Modal show={viewContact !== null} onClose={() => setViewContact(null)}>
        <Modal.Header>Contact Details</Modal.Header>
        <Modal.Body>
          {viewContact && (
            <div className="space-y-4">
              <p><strong>Name:</strong> {viewContact.cusContact_FullName}</p>
              <p><strong>Phone:</strong> {viewContact.cusContact_Phone}</p>
              <p><strong>Date:</strong> {toThaiDateNumericString(viewContact.cusContact_Date)}</p>
              <p><strong>Status:</strong> {viewContact.conStatus_Name}</p>
              <p><strong>Platform:</strong> {viewContact.platform_Name}</p>
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
              <p className="text-sm text-gray-400 mt-4 border-t pt-2">Added by: {viewContact.employee_FullName}</p>
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
