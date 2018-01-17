// @flow
import React from 'react';
import { List, Map } from 'immutable';

import ModuleBlock from './moduleBlock';

type Props = {
  modules: List<Map>
};

const ModulesPreview = ({ modules }: Props) => {
  if (modules.size <= 0) {
    return null;
  }

  const header = modules.get(0);
  const footer = modules.get(modules.size - 1);
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