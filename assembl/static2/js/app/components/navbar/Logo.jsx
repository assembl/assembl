// @flow

import React from 'react';
import { Link } from 'react-router';

import { get } from '../../utils/routeMap';

type Props = { src: string, slug: string, url: string };

const Logo = ({ src, slug, url }: Props) => {
  const image = <img src={src} alt="logo" />;
  return (
    <div className="navbar-logo">
      {url ? (
        <a href={url}>{image}</a>
      ) : (
        <Link to={`${get('home', { slug: slug })}`} activeClassName="logo-active">
          {image}
        </Link>
      )}
    </div>
  );
};

export default Logo;