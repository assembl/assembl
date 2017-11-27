import React from 'react';
import { Link } from 'react-router';

import { get } from '../../utils/routeMap';

const Logo = ({ src, slug }) => {
  return (
    <div className="navbar-logo">
      <Link to={`${get('home', { slug: slug })}`} activeClassName="logo-active">
        <img src={src} alt="logo" />
      </Link>
    </div>
  );
};

export default Logo;