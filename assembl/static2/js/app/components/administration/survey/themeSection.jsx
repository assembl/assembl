import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';

import SectionTitle from '../sectionTitle';
import ThemeForm from './themeForm';
import { createNewThematic } from '../../../actions/adminActions';

const addTooltip = (
  <Tooltip id="addTooltip">
    <Translate value="administration.addThematic" />
  </Tooltip>
);

const ThemeSection = ({ addThematic, i18n, selectedLocale, thematics }) => {
  return (
    <div className="admin-box">
      <SectionTitle i18n={i18n} phase="survey" tabId="0" annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <form>
          {thematics.map((id, idx) => {
            return <ThemeForm key={id} id={id} index={idx} selectedLocale={selectedLocale} />;
          })}
          <OverlayTrigger placement="top" overlay={addTooltip}>
            <div onClick={addThematic} className="plus margin-l">+</div>
          </OverlayTrigger>
        </form>
      </div>
    </div>
  );
};

const mapStateToProps = ({ admin: { thematicsById, thematicsInOrder, selectedLocale }, i18n }) => {
  return {
    thematics: thematicsInOrder.filter((id) => {
      return !thematicsById.getIn([id, 'toDelete']);
    }),
    i18n: i18n,
    selectedLocale: selectedLocale
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addThematic: () => {
      const newThemeId = Math.round(Math.random() * -1000000).toString();
      dispatch(createNewThematic(newThemeId));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ThemeSection);