// @flow
import * as React from 'react';
import { List, Map } from 'immutable';
import { I18n } from 'react-redux-i18n';
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
    const id = module.getIn(['moduleType', 'id']);
    const moduleTitle = module.getIn(['moduleType', 'title']);
    return (
      <ModuleBlock
        key={id}
        moveDown={() => moveModuleDown(id)}
        moveUp={() => moveModuleUp(id)}
        required={module.getIn(['moduleType', 'required'])}
        title={moduleTitle || I18n.t('administration.landingPage.manageModules.textAndMultimedia')}
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