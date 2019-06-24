// @flow
import * as React from 'react';
import { List, Map } from 'immutable';
import { I18n } from 'react-redux-i18n';
import ModuleBlock from './moduleBlock';

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