import { useEffect, useState } from "react";
import { Card, Spinner } from "flowbite-react";
import { Icon } from "@iconify/react";
import { crmService, ContactReport } from "../../services/api/crmService";
import { ContactStatus, Platform, HospitalService } from "../../types/crm.types";
import ReactApexChart from "react-apexcharts";

const CustomerContactReport = () => {
  const [report, setReport] = useState<ContactReport | null>(null);
  const [statuses, setStatuses] = useState<ContactStatus[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [services, setServices] = useState<HospitalService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const [rData, sData, pData, hData] = await Promise.all([
          crmService.getContactReport(),
          crmService.getStatuses(),
          crmService.getPlatforms(),
          crmService.getHospitalServices()
        ]);
        setReport(rData);
        setStatuses(sData);
        setPlatforms(pData);
        setServices(hData);
      } catch (error) {
        console.error("Failed to load report", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading || !report) {
    return (
      <Card className="col-span-12 shadow-sm rounded-md p-6 flex justify-center">
        <Spinner size="xl" />
      </Card>
    );
  }

  // Map IDs to Names
  const getStatusName = (id: string) => statuses.find(s => s.conStatus_Id === id)?.conStatus_Name || id;
  const getPlatformName = (id: string) => platforms.find(p => p.platform_Id === id)?.platform_Name || id;
  const getServiceName = (id: string) => services.find(s => s.hosService_Id === id)?.hosService_Name || id;

  const platformLabels = Object.keys(report.by_platform).map(getPlatformName);
  const platformSeries = Object.values(report.by_platform);

  const statusLabels = Object.keys(report.by_status).map(getStatusName);
  const statusSeries = Object.values(report.by_status);

  // Sorting services to show top ones maybe? Or just keep all
  const serviceItems = Object.entries(report.by_service)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      
      {/* Total Overview Card */}
      <Card className="shadow-md border-0 bg-blue-50 dark:bg-gray-800">
        <div className="flex items-center">
          <div className="p-3 bg-blue-500 rounded-full text-white mr-4">
             <Icon icon="solar:users-group-rounded-linear" className="w-8 h-8" />
          </div>
          <div>
            <h5 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase">Total Contacts</h5>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{report.total_contacts}</h2>
          </div>
        </div>
      </Card>

      {/* Platform Chart */}
      <Card className="shadow-md border-0 md:col-span-1">
        <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contacts by Platform</h5>
        {platformSeries.length > 0 ? (
          <ReactApexChart
            options={{
              chart: { type: 'donut', fontFamily: 'inherit' },
              labels: platformLabels,
              legend: { position: 'bottom' },
              dataLabels: { enabled: true }
            }}
            series={platformSeries}
            type="donut"
            height={250}
          />
        ) : <p className="text-gray-500 text-sm text-center py-4">No Data</p>}
      </Card>

      {/* Status Chart */}
      <Card className="shadow-md border-0 md:col-span-1">
        <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contacts by Status</h5>
        {statusSeries.length > 0 ? (
          <ReactApexChart
            options={{
              chart: { type: 'pie', fontFamily: 'inherit' },
              labels: statusLabels,
              legend: { position: 'bottom' },
              dataLabels: { enabled: true }
            }}
            series={statusSeries}
            type="pie"
            height={250}
          />
        ) : <p className="text-gray-500 text-sm text-center py-4">No Data</p>}
      </Card>

      {/* Popular Services Table/List */}
      <Card className="col-span-1 md:col-span-3 shadow-md border-0">
         <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Interested Services Count</h5>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {serviceItems.length > 0 ? serviceItems.map(([id, count]) => (
               <div key={id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getServiceName(id)}</span>
                  <span className="text-md font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-gray-800 py-1 px-3 rounded-full">{count}</span>
               </div>
            )) : <p className="text-gray-500 text-sm py-4">No Data</p>}
         </div>
      </Card>

    </div>
  );
};

export default CustomerContactReport;
