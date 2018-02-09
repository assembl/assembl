// @flow
import React from 'react';
import { List, Map } from 'immutable';

import ModuleBlock from './moduleBlock';

type Props = {
  modules: List<Map>,
  moveModuleDown: Function,
  moveModuleUp: Function
};

const ModulesPreview = ({ modules, moveModuleDown, moveModuleUp }: Props) => {
  if (modules.size <= 0) {
    return null;
  }

  const renderModuleBlock = (module) => {
    const identifier = module.getIn(['moduleType', 'identifier']);
    return (
      <ModuleBlock
        key={identifier}
        moveDown={() => moveModuleDown(identifier)}
        moveUp={() => moveModuleUp(identifier)}
        required={module.getIn(['moduleType', 'required'])}
        title={module.getIn(['moduleType', 'title'])}
        withArrows={module.getIn(['moduleType', 'editableOrder'])}
      />
    );
  };

  const header = modules.get(0);
  const footer = modules.get(modules.size - 1);
  return (
    <div className="box modules-preview">
      <div className="inner">
        {renderModuleBlock(header)}
        <div className="other-modules">{modules.slice(1, -1).map(module => renderModuleBlock(module))}</div>
        {renderModuleBlock(footer)}
      </div>
    </div>
  );
};

export default ModulesPreview;