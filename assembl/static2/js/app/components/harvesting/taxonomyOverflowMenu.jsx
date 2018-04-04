// @flow
import React from 'react';
import { Popover } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';
import { extractNatures, extractActions, NatureIcons, ActionIcons } from '../../utils/extractQualifier';

const TaxonomyOverflowMenu = (handleClick: Function, extractNature: ?string, extractAction: ?string) => (
  <Popover id="taxonomy" className="taxonomy-menu overflow-menu">
    <div className="pointer taxonomy-label taxonomy-label-border">
      <Translate value="harvesting.move" />
    </div>
    <div className="taxonomy-category">
      <Translate value="harvesting.qualifyNature" />
    </div>
    <div className="pointer">
      {extractNatures.map(n => (
        <div
          onClick={() => {
            handleClick('nature', n.qualifier);
          }}
          key={n.qualifier}
          className={classnames('taxonomy-label', { active: extractNature === n.qualifier })}
        >
          <NatureIcons qualifier={n.qualifier} />
          <div className="nature-label">
            <Translate value={n.label} />
          </div>
        </div>
      ))}
    </div>
    <div className="taxonomy-category">
      <Translate value="harvesting.qualifyAction" />
    </div>
    <div className="pointer">
      {extractActions.map(a => (
        <div
          onClick={() => {
            handleClick('action', a.qualifier);
          }}
          key={a.qualifier}
          className={classnames('taxonomy-label', { active: extractAction === a.qualifier })}
        >
          <ActionIcons qualifier={a.qualifier} />
          <div className="action-label">
            <Translate value={a.label} />
          </div>
        </div>
      ))}
    </div>
  </Popover>
);

export default TaxonomyOverflowMenu;