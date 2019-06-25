// @flow
import * as React from 'react';
import { List, Map } from 'immutable';
import { I18n } from 'react-redux-i18n';
import ModuleBlock from './moduleBlock';
import { MODULES } from './manageModules';

type Props = {
  editModule: ((module: LandingPageModule) => any) | void,
  modules: List<Map>,
  moveModuleDown: Function,
  moveModuleUp: Function,
  removeModule: ((module: LandingPageModule) => any) | void
};

const ModulesPreview = ({ editModule, modules, moveModuleDown, moveModuleUp, removeModule }: Props) => {
  if (modules.size <= 0) {
    return null;
  }
  const renderModuleBlock = (module) => {
    const id = module.get('id');
    const moduleType = module.getIn(['moduleType', 'identifier']);
    const moduleTypeTitle = module.getIn(['moduleType', 'title']);
    const moduleTitle = module.get('title') ? `${moduleTypeTitle} : ${module.get('title')}` : moduleTypeTitle;
    // FIXME: timeline will be orderable
    const editableOrder = module.getIn(['moduleType', 'editableOrder']) && moduleType !== MODULES.timeline.identifier;
    return (
      <ModuleBlock
        key={id}
        moveDown={() => moveModuleDown(id)}
        moveUp={() => moveModuleUp(id)}
        edit={editModule ? editModule(module) : undefined}
        remove={removeModule ? removeModule(module) : undefined}
        required={module.getIn(['moduleType', 'required'])}
        title={moduleTitle || I18n.t('administration.landingPage.manageModules.textAndMultimedia')}
        type={moduleType}
        withArrows={editableOrder}
      />
    );
  };

  const header = modules.get(0);
  const timeline = modules.get(modules.size - 2);
  const footer = modules.get(modules.size - 1);
  return (
    <div className="box modules-preview">
      <div className="inner">
        {renderModuleBlock(header)}
        <div className="other-modules">{modules.slice(1, -2).map(module => renderModuleBlock(module))}</div>
        {renderModuleBlock(timeline)}
        {renderModuleBlock(footer)}
      </div>
    </div>
  );
};

export default ModulesPreview;