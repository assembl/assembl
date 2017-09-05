import React from 'react';
import { Translate } from 'react-redux-i18n';
import Doughnut from '../../svg/doughnut';

export default () => {
  return (
    <div>
      <Translate value="debate.thread.announcement" />
      <Doughnut elements={[{ name: 'green', count: 9 }, { name: 'red', count: 1 }]} />
    </div>
  );
};