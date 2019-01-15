// @flow
import React from 'react';
// Component imports
import Loader, { LOADER_TYPE } from '../../../components/common/loader/loader';

const SemanticAnalysis = () => (
  <div className="semantic-analysis">
    <Loader type={LOADER_TYPE.LOADING} />
    <Loader type={LOADER_TYPE.ERROR} />
  </div>
);

export default SemanticAnalysis;