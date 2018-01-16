// @flow
import React from 'react';
import { Map } from 'immutable';

import ModuleBlock from './moduleBlock';

type Props = {
  modules: Map<string, Map>
};

const ModulesPreview = ({ modules }: Props) => {
  const header = modules[0];
  const footer = modules[modules.length - 1];
  return (
    <div className="box modules-preview">
      <div className="inner">
        <ModuleBlock key={header.getIn(['moduleType', 'identifier'])} title={header.getIn(['moduleType', 'title'])} />
        <div className="other-modules">
          {modules
            .slice(1, -1)
            .map(module => (
              <ModuleBlock key={module.getIn(['moduleType', 'identifier'])} title={module.getIn(['moduleType', 'title'])} />
            ))}
        </div>
        <ModuleBlock key={footer.getIn(['moduleType', 'identifier'])} title={footer.getIn(['moduleType', 'title'])} />
      </div>
    </div>
  );
};

export default ModulesPreview;