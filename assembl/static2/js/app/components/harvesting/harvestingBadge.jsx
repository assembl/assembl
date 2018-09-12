// @flow
import * as React from 'react';

type Props = {
  setExtractsBoxDisplay: Function,
  extractsNumber: number
};

const harvestingBadge = ({ setExtractsBoxDisplay, extractsNumber }: Props) => (
  <div className="harvesting-anchor" onClick={setExtractsBoxDisplay}>
    <div>{extractsNumber}</div>
    <div className="left-side-harvesting-button">
      <div className="left-side-harvesting-button__button">
        <div className="left-side-harvesting-button__button__inside">
          <span className="confirm-harvest-button assembl-icon-catch" />
        </div>
      </div>
    </div>
  </div>
);

export default harvestingBadge;