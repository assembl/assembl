import React from 'react';
import { Popover } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';
import { extractNatures, extractActions } from '../../utils/extractQualifier';

const TaxonomyOverflowMenu = handleClick => (
  <Popover id="taxonomy-menu" className="overflow-menu">
    <div className="pointer">
      {extractNatures.map(n => (
        <div
          onClick={() => {
            handleClick('nature', n.qualifier);
          }}
          key={n.qualifier}
        >
          {I18n.t(n.label)}
        </div>
      ))}
    </div>
    <div className="pointer">
      {extractActions.map(a => (
        <div
          onClick={() => {
            handleClick('action', a.qualifier);
          }}
          key={a.qualifier}
        >
          {I18n.t(a.label)}
        </div>
      ))}
    </div>
  </Popover>
);

export default TaxonomyOverflowMenu;