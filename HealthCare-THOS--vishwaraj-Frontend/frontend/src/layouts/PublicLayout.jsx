/**
 * layouts/PublicLayout.jsx — Layout for public (unauthenticated) pages.
 * New Landing/Login/Register are self-contained with their own navigation,
 * so this layout simply renders the Outlet.
 */

import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return <Outlet />;
};

export default PublicLayout;
