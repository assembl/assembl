// @flow

import React from 'react';
import { Link } from 'react-router';

import { get } from '../../utils/routeMap';

type Props = { src: string, slug: string };

const Logo = ({ src, slug }: Props) => {
  return (
    <div className="navbar-logo">
      <Link to={`${get('home', { slug: slug })}`} activeClassName="logo-active">
        <img src={src} alt="logo" />
      </Link>
    </div>
  );
};

export default Logo;