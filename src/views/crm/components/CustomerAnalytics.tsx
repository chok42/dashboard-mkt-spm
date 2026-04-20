import { useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Card, Button, ButtonGroup } from "flowbite-react";
import { Icon } from "@iconify/react";
import { CustomerContact, Platform, ContactStatus, HospitalService } from "../../../types/crm.types";
import { ContactReport } from "../../../services/api/crmService";
import { 
  format, 
  eachDayOfInterval, 
  parseISO, 
  getDay, 
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  isSameMonth,
  isSameDay,
  isSameYear,
  eachYearOfInterval,
  startOfYear,
  endOfYear
} from "date-fns";
import { th } from "date-fns/locale";

interface CustomerAnalyticsProps {
  contacts: CustomerContact[];
  platforms: Platform[];
  statuses: ContactStatus[];
  services: HospitalService[];
  report: ContactReport | null;
}

type TimeRange = 'daily' | 'monthly' | 'yearly';

const CustomerAnalytics = ({ contacts, platforms, statuses, services, report }: CustomerAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');

  // Helper to get Names
  const getPlatformName = (id: string) => platforms.find(p => p.platform_Id === id)?.platform_Name || id;
  const getStatusName = (id: string) => statuses.find(s => s.conStatus_Id === id)?.conStatus_Name || id;
  const getServiceName = (id: string) => services.find(s => s.hosService_Id === id)?.hosService_Name || id;

  const stats = useMemo(() => {
    if (contacts.length === 0) return { total: 0, avgDaily: 0, peakDay: "-", topPlatform: "-" };

    const sortedContacts = [...contacts].sort((a, b) => new Date(a.cusContact_Date).getTime() - new Date(b.cusContact_Date).getTime());
    const startDate = new Date(sortedContacts[0].cusContact_Date);
    const endDate = new Date(sortedContacts[sortedContacts.length - 1].cusContact_Date);
    
    // Calculate Days Span (at least 1 day)
    const daysSpan = Math.max(1, differenceInDays(endDate, startDate) + 1);
    const avgDaily = (contacts.length / daysSpan).toFixed(2);

    // Peak Day of Week
    const daysOfWeek = Array(7).fill(0);
    contacts.forEach(c => {
      const day = getDay(parseISO(c.cusContact_Date));
      daysOfWeek[day]++;
    });
    const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    const peakDayIdx = daysOfWeek.indexOf(Math.max(...daysOfWeek));
    const peakDay = dayNames[peakDayIdx];

    // Top Platform
    const platformCounts: Record<string, number> = {};
    contacts.forEach(c => {
      platformCounts[c.platform_Id] = (platformCounts[c.platform_Id] || 0) + 1;
    });
    const topPlatformId = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topPlatform = getPlatformName(topPlatformId);

    return {
      total: contacts.length,
      avgDaily,
      peakDay,
      topPlatform,
      daysOfWeek
    };
  }, [contacts, platforms]);

  // Chart Data: Time Series (Daily / Monthly / Yearly)
  const timeSeriesData = useMemo(() => {
    if (contacts.length === 0) return { series: [], categories: [] };

    const sortedContacts = [...contacts].sort((a, b) => new Date(a.cusContact_Date).getTime() - new Date(b.cusContact_Date).getTime());
    const start = new Date(sortedContacts[0].cusContact_Date);
    const end = new Date(sortedContacts[sortedContacts.length - 1].cusContact_Date);

    let categories: string[] = [];
    let seriesData: number[] = [];

    if (timeRange === 'daily') {
      const interval = eachDayOfInterval({ start, end });
      categories = interval.map(d => format(d, "d MMM", { locale: th }));
      seriesData = interval.map(d => contacts.filter(c => isSameDay(parseISO(c.cusContact_Date), d)).length);
    } else if (timeRange === 'monthly') {
      const interval = eachMonthOfInterval({ start: startOfMonth(start), end: endOfMonth(end) });
      categories = interval.map(d => format(d, "MMM yyyy", { locale: th }));
      seriesData = interval.map(d => contacts.filter(c => isSameMonth(parseISO(c.cusContact_Date), d)).length);
    } else {
      const interval = eachYearOfInterval({ start: startOfYear(start), end: endOfYear(end) });
      categories = interval.map(d => format(d, "yyyy", { locale: th }));
      seriesData = interval.map(d => contacts.filter(c => isSameYear(parseISO(c.cusContact_Date), d)).length);
    }

    return {
      series: [{ name: "จำนวนลูกค้า", data: seriesData }] as ApexAxisChartSeries,
      categories
    };
  }, [contacts, timeRange]);

  // Chart Data: Weekly Trend
  const weeklyTrendData = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
      series: [{ name: "จำนวนติดต่อ", data: stats.daysOfWeek }] as ApexAxisChartSeries,
      categories: dayNames
    };
  }, [stats]);

  const platformChartData = useMemo(() => {
    if (!report) return { series: [], labels: [] };
    const labels = Object.keys(report.by_platform).map(getPlatformName);
    const series = Object.values(report.by_platform);
    return { series, labels };
  }, [report, platforms]);

  const statusChartData = useMemo(() => {
    if (!report) return { series: [], labels: [] };
    const labels = Object.keys(report.by_status).map(getStatusName);
    const series = Object.values(report.by_status);
    return { series, labels };
  }, [report, statuses]);

  const serviceChartData = useMemo(() => {
    if (!report) return { series: [], categories: [] };
    const sorted = Object.entries(report.by_service).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const categories = sorted.map(([id]) => getServiceName(id));
    const data = sorted.map(([, count]) => count);
    return {
      series: [{ name: "จำนวนสนใจ", data }] as ApexAxisChartSeries,
      categories
    };
  }, [report, services]);

  // Insights Logic
  const insights = useMemo(() => {
    if (contacts.length === 0) return [];
    
    const list = [];
    list.push(`มีผู้ติดต่อเฉลี่ย ${stats.avgDaily} รายต่อวัน`);
    list.push(`ช่องทางที่ได้รับความนิยมสูงสุดคือ ${stats.topPlatform}`);
    list.push(`วันที่ลูกค้าติดต่อหนาแน่นที่สุดคือวัน${stats.peakDay}`);
    
    // Service Insight
    // Space reserved for future service-based insights
    
    return list;
  }, [stats, contacts]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase">Total Contacts</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Icon icon="solar:users-group-two-rounded-bold" className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-green-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase">Avg Daily</p>
              <h3 className="text-2xl font-bold">{stats.avgDaily}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <Icon icon="solar:calendar-minimalistic-bold" className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-purple-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase">Peak Day</p>
              <h3 className="text-2xl font-bold">{stats.peakDay}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <Icon icon="solar:chart-2-bold" className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-orange-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase">Top Platform</p>
              <h3 className="text-2xl font-bold">{stats.topPlatform}</h3>
            </div>
            <div className="p-3 bg-orange-100 rounded-full text-orange-600">
              <Icon icon="solar:smartphone-2-bold" className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Platform Analysis */}
        <Card className="shadow-sm">
          <h5 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon icon="solar:smartphone-line-duotone" className="text-blue-500" />
            วิเคราะห์ช่องทาง
          </h5>
          <ReactApexChart
            options={{
              chart: { type: 'donut', fontFamily: 'inherit' },
              labels: platformChartData.labels,
              legend: { position: 'bottom' },
              stroke: { show: false },
              dataLabels: { enabled: true, formatter: (val) => `${Number(val).toFixed(0)}%` },
              plotOptions: { pie: { donut: { size: '65%' } } }
            }}
            series={platformChartData.series}
            type="donut"
            height={300}
          />
        </Card>

        {/* Status Analysis */}
        <Card className="shadow-sm">
          <h5 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon icon="solar:tag-bold-duotone" className="text-green-500" />
            วิเคราะห์สถานะ
          </h5>
          <ReactApexChart
            options={{
              chart: { type: 'pie', fontFamily: 'inherit' },
              labels: statusChartData.labels,
              legend: { position: 'bottom' },
              stroke: { show: false },
              dataLabels: { enabled: true }
            }}
            series={statusChartData.series}
            type="pie"
            height={300}
          />
        </Card>

        {/* Service Analysis */}
        <Card className="shadow-sm">
          <h5 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon icon="solar:medical-kit-bold-duotone" className="text-red-500" />
            วิเคราะห์บริการ (Top 8)
          </h5>
          <ReactApexChart
            options={{
              chart: { type: 'bar', toolbar: { show: false } },
              plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
              colors: ['#ef4444'],
              xaxis: { categories: serviceChartData.categories },
              dataLabels: { enabled: true }
            }}
            series={serviceChartData.series}
            type="bar"
            height={300}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h5 className="text-lg font-bold flex items-center gap-2">
              <Icon icon="solar:graph-up-bold-duotone" className="text-primary" />
              กราฟวิเคราะห์ข้อมูลลูกค้า (แนวโน้ม)
            </h5>
            <ButtonGroup>
              <Button size="sm" color={timeRange === 'daily' ? 'info' : 'gray'} onClick={() => setTimeRange('daily')}>รายวัน</Button>
              <Button size="sm" color={timeRange === 'monthly' ? 'info' : 'gray'} onClick={() => setTimeRange('monthly')}>รายเดือน</Button>
              <Button size="sm" color={timeRange === 'yearly' ? 'info' : 'gray'} onClick={() => setTimeRange('yearly')}>รายปี</Button>
            </ButtonGroup>
          </div>
          <ReactApexChart
            options={{
              chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
              colors: ['#3b82f6'],
              fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2, stops: [0, 90, 100] } },
              dataLabels: { enabled: false },
              stroke: { curve: 'smooth', width: 3 },
              xaxis: { categories: timeSeriesData.categories },
              tooltip: { x: { format: 'dd/MM/yy' } },
            }}
            series={timeSeriesData.series}
            type="area"
            height={320}
          />
        </Card>

        {/* Weekly Trend Component */}
        <Card className="shadow-sm">
          <h5 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon icon="solar:calendar-date-bold-duotone" className="text-orange-500" />
            แนวโน้มรายวันในสัปดาห์
          </h5>
          <ReactApexChart
            options={{
              chart: { type: 'bar', toolbar: { show: false } },
              plotOptions: { bar: { borderRadius: 4, distributed: true } },
              colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'],
              xaxis: { categories: weeklyTrendData.categories },
              legend: { show: false }
            }}
            series={weeklyTrendData.series}
            type="bar"
            height={320}
          />
        </Card>
      </div>

      {/* Insights Section */}
      <Card className="shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-none">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="solar:lightbulb-bold" className="text-yellow-500 w-6 h-6" />
          <h5 className="text-lg font-bold">Insights สำคัญ</h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg backdrop-blur-sm shadow-sm border border-white/20">
              <Icon icon="solar:check-circle-bold" className="text-green-500 w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700 dark:text-gray-200 text-sm">{insight}</p>
            </div>
          ))}
          {insights.length === 0 && <p className="text-gray-500">เก็บข้อมูลเพิ่มเพื่อวิเคราะห์ Insights</p>}
        </div>
      </Card>
    </div>
  );
};

export default CustomerAnalytics;
