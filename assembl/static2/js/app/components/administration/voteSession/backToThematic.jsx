// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

type Props = {
  url: string
};

const BackToThematic = ({ url }: Props) => (
  <div className="margin-m">
    <Link to={url} className="button-link button-dark">
      <Translate value="administration.goBackToThematic" />
    </Link>
  </div>
);

export default BackToThematic;