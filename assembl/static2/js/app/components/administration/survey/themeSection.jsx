import React from 'react';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { OverlayTrigger } from 'react-bootstrap';

import SectionTitle from '../sectionTitle';
import ThemeForm from './themeForm';
import { createNewThematic } from '../../../actions/adminActions';
import { addThematicTooltip } from '../../common/tooltips';

class ThemeSection extends React.Component {
  componentWillMount() {
    const { toggleLanguageMenu } = this.props;
    toggleLanguageMenu(true);
  }

  render() {
    const { addThematic, selectedLocale, thematics } = this.props;
    return (
      <div className="admin-box">
        <SectionTitle title={I18n.t('administration.survey.0')} annotation={I18n.t('administration.annotation')} />
        <div className="admin-content">
          <form>
            {thematics.map((id, idx) => <ThemeForm key={id} id={id} index={idx} selectedLocale={selectedLocale} />)}
            <OverlayTrigger placement="top" overlay={addThematicTooltip}>
              <div onClick={addThematic} className="plus margin-l">
                +
              </div>
            </OverlayTrigger>
          </form>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { thematicsById, thematicsInOrder, selectedLocale } }) => ({
  thematics: thematicsInOrder.filter(id => !thematicsById.getIn([id, 'toDelete'])),
  selectedLocale: selectedLocale
});

const mapDispatchToProps = dispatch => ({
  addThematic: () => {
    const newThemeId = Math.round(Math.random() * -1000000).toString();
    dispatch(createNewThematic(newThemeId));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(ThemeSection);