import React from "react";

interface PrivateRouteProps {
  rolePrimary?: string;
  roleTrial?: string;
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  rolePrimary = "",
  roleTrial = "",
  children,
}) => {
  if (rolePrimary === roleTrial) {
    return <>{children}</>;
  }
  return null;
};
