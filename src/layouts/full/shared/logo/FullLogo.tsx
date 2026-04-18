

import Logo from "/src/assets/images/logos/spm-logo.avif";
import { Link } from "react-router";
const FullLogo = () => {
  return (
    <Link to={"/"}>
      <img src={Logo} alt="logo" className="block" />
    </Link>
  );
};

export default FullLogo;
