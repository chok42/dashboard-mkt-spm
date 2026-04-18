import { uniqueId } from "lodash";

export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  isPro?: boolean;
  roles?: string[];
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number | string;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
  isPro?: boolean
}

const SidebarContent: MenuItem[] = [
  {
    heading: "Home",
    children: [
      {
        name: "Dashboard",
        icon: "solar:widget-add-line-duotone",
        id: uniqueId(),
        url: "/",
        isPro: false,
      },
      {
        name: "Customer Contacts",
        icon: "solar:screencast-2-line-duotone",
        id: uniqueId(),
        url: "/crm/contacts",
        isPro: false,
      },
      {
        name: "Platforms",
        icon: "solar:smartphone-update-outline",
        id: uniqueId(),
        url: "/crm/platforms",
        isPro: false,
      },
      {
        name: "Hospital Services",
        icon: "solar:health-linear",
        id: uniqueId(),
        url: "/crm/services",
        isPro: false,
      },
      {
        name: "Employees",
        icon: "solar:users-group-two-rounded-outline",
        id: uniqueId(),
        url: "/crm/employees",
        isPro: false,
        roles: ["1"], // Admin only
      }
    ],
  },
  // {
  //   heading: "Utilities",
  //   children: [
  //     {
  //       name: "Typography",
  //       icon: "solar:text-circle-outline",
  //       id: uniqueId(),
  //       url: "/ui/typography",
  //       isPro: false,
  //     },
  //     {
  //       name: "Table",
  //       icon: "solar:bedside-table-3-linear",
  //       id: uniqueId(),
  //       url: "/ui/table",
  //       isPro: false,
  //     },
  //     {
  //       name: "Form",
  //       icon: "solar:password-minimalistic-outline",
  //       id: uniqueId(),
  //       url: "/ui/form",
  //       isPro: false,
  //     },
  //     {
  //       name: "Alert",
  //       icon: "solar:airbuds-case-charge-outline",
  //       id: uniqueId(),
  //       url: "/ui/alert",
  //       isPro: false,
  //     },
  //   ],
  // }
];

export default SidebarContent;
