// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = {
  errorMessage: string
};
const Error = ({ errorMessage }: Props) => (
  <div>
    <p>
      <b>
        <Translate value="error.reason" />
      </b>&nbsp;&quot;{errorMessage}&quot;
    </p>
  </div>
);

export default Error;