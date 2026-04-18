import { Sidebar } from "flowbite-react";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import SimpleBar from "simplebar-react";
import React from "react";
import FullLogo from "../shared/logo/FullLogo";
// import Upgrade from "./Upgrade";
import NavCollapse from "./NavCollapse";
import { useAuth } from "../../../contexts/AuthContext";

const SidebarLayout = () => {
  const { user } = useAuth();

  // If the user role is not Admin, Manager, or Employee, hide everything
  const isValidRole = ["R99", "R01", "R02"].includes(user?.role_Id || "");

  return (
    <>
      <div className="xl:block hidden">
        <Sidebar
          className="fixed menu-sidebar  bg-white dark:bg-darkgray rtl:pe-4 rtl:ps-0 top-[72px]"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <div className="px-6 py-4 flex items-center sidebarlogo">
            <FullLogo />
          </div>
          <SimpleBar className="h-[calc(100vh_-_294px)]">
            <Sidebar.Items className="px-5 mt-2">
              <Sidebar.ItemGroup className="sidebar-nav hide-menu">
                {isValidRole && SidebarContent &&
                  SidebarContent?.map((item, index) => (
                    <div className="caption" key={item.heading}>
                      <React.Fragment key={index}>
                        <h5 className="text-link dark:text-white/70  font-semibold leading-6 text-sm pb-2">
                          {item.heading}
                        </h5>
                        {item.children?.filter(child => !child.roles || child.roles.includes(user?.role_Id || "")).map((child, index) => (
                          <React.Fragment key={child.id && index}>
                            {child.children ? (
                              <div className="collpase-items">
                                <NavCollapse item={child} />
                              </div>
                            ) : (
                              <NavItems item={child} />
                            )}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    </div>
                  ))}
              </Sidebar.ItemGroup>
            </Sidebar.Items>
          </SimpleBar>
          {/* <Upgrade/> */}
        </Sidebar>
      </div>
    </>
  );
};

export default SidebarLayout;
