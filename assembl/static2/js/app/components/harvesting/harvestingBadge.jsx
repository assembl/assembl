// @flow
import * as React from 'react';

type Props = {
  setExtractsBoxDisplay: Function,
  extractsNumber: number
};

const harvestingBadge = ({ setExtractsBoxDisplay, extractsNumber }: Props) => (
  <div className="relative">
    <div className="harvesting-badge" onClick={setExtractsBoxDisplay}>
      <div className="badge-total">{extractsNumber}</div>
      <div className="left-side-harvesting-button">
        <div className="left-side-harvesting-button__button">
          <div className="left-side-harvesting-button__button__inside">
            <span className="confirm-harvest-button assembl-icon-catch" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default harvestingBadge;