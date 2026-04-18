import React from "react";

interface PrivateRouteListProps {
  role?: string;
  roles?: string[];
  children: React.ReactNode;
}

export const PrivateRouteList: React.FC<PrivateRouteListProps> = ({
  role = "",
  roles = [],
  children,
}) => {
  const result = roles.find((fd) => fd === role);
  return result ? <>{children}</> : null;
};
