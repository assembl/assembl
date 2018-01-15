// @flow
import React from 'react';
import { Map } from 'immutable';

import ModuleBlock from './moduleBlock';

type Props = {
  modules: Map<string, Map>
};

const ModulesPreview = ({ modules }: Props) => (
  <div className="modules-preview">
    {modules.map(module => (
      <ModuleBlock key={module.getIn(['moduleType', 'identifier'])} title={module.getIn(['moduleType', 'title'])} />
    ))}
  </div>
);

export default ModulesPreview;