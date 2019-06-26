// @flow
import * as React from 'react';
import { List, Map } from 'immutable';
import ModuleBlock from './moduleBlock';

type Props = {
  editModule: ((module: LandingPageModule) => any) | void,
  modules: List<Map>,
  moveModuleDown: Function,
  moveModuleUp: Function,
  removeModule: ((module: LandingPageModule) => any) | void,
  updateModuleEnabled: ((module: LandingPageModule) => any) | void
};

const ModulesPreview = ({ editModule, modules, moveModuleDown, moveModuleUp, removeModule, updateModuleEnabled }: Props) => {
  if (modules.size <= 0) {
    return null;
  }
  const renderModuleBlock = (module) => {
    const id = module.get('id');
    // FIXME: timeline will be orderable
    return (
      <ModuleBlock
        key={id}
        module={module}
        updateEnabled={updateModuleEnabled ? updateModuleEnabled(module) : undefined}
        moveDown={() => moveModuleDown(id)}
        moveUp={() => moveModuleUp(id)}
        edit={editModule ? editModule(module) : undefined}
        remove={removeModule ? removeModule(module) : undefined}
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