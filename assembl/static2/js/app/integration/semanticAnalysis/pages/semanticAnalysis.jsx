// @flow
import React from 'react';
// Component imports
import Loader, { LOADER_TYPE } from '../../../components/common/loader/loader';
import ToolbarSlider from '../../../components/common/toolbarSlider/toolbarSlider';

const SemanticAnalysis = () => (
  <div className="semantic-analysis">
    <Loader type={LOADER_TYPE.LOADING} />
    <Loader type={LOADER_TYPE.ERROR} />
    <ToolbarSlider defaultValue={50} onSliderChange={() => {}} />
  </div>
);

export default SemanticAnalysis;