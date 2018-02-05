// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import Helper from '../../common/helper';
import TokensForm from './tokensForm';
import {
  createTokenVoteModule,
  deleteTokenVoteModule,
  createGaugeVoteModule,
  deleteGaugeVoteModule
} from '../../../actions/adminActions/voteSession';
import GaugesForm from './gaugesForm';

type ModulesSectionProps = {
  tokenModules: Object,
  editLocale: string,
  handleTokenCheckBoxChange: Function
};

class DumbModulesSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showGauge: false
    };
  }

  render() {
    const { tokenModules, editLocale, handleTokenCheckBoxChange } = this.props;
    const tokenModuleChecked = tokenModules.size > 0;
    // const gaugeModuleChecked = gaugeModules.size > 0;
    const tModule = tokenModules.toJS();
    const { showGauge } = this.state;
    // const gModule = gaugeModules.toJS();
    return (
      <div className="admin-box">
        <SectionTitle title={I18n.t('administration.voteSession.1')} annotation={I18n.t('administration.annotation')} />
        <div className="admin-content">
          <div className="form-container">
            <div>
              <Checkbox
                checked={tokenModuleChecked}
                onChange={() => {
                  handleTokenCheckBoxChange(tokenModuleChecked, tModule[0]);
                }}
              >
                <Helper
                  label={I18n.t('administration.voteWithTokens')}
                  helperUrl="/static2/img/helpers/helper4.png"
                  helperText={I18n.t('administration.tokenVoteCheckbox')}
                  classname="inline"
                />
              </Checkbox>
              <Checkbox
                checked={showGauge}
                onChange={() => {
                  this.setState({ showGauge: !showGauge });
                }}
              >
                <Helper
                  label={I18n.t('administration.voteWithGages')}
                  helperUrl="/static2/img/helpers/helper3.png" // TODO: add an actual screenshot
                  helperText={I18n.t('administration.gaugeVoteCheckbox')}
                  classname="inline"
                />
              </Checkbox>
              {tokenModules.map(id => <TokensForm key={id} id={id} editLocale={editLocale} />)}
              {showGauge && <GaugesForm />}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ admin }) => {
  const { modulesInOrder, modulesById } = admin.voteSession;
  const { editLocale } = admin;
  return {
    tokenModules: modulesInOrder.filter(
      id => modulesById.getIn([id, 'type']) === 'tokens' && !modulesById.getIn([id, 'toDelete'])
    ),
    editLocale: editLocale
  };
};

const mapDispatchToProps = (dispatch) => {
  const newId = Math.round(Math.random() * -1000000).toString();
  return {
    handleTokenCheckBoxChange: (checked, id) => {
      if (!checked) {
        dispatch(createTokenVoteModule(newId));
      } else {
        dispatch(deleteTokenVoteModule(id));
      }
    },
    handleGaugeCheckBoxChange: (checked, id) => {
      if (!checked) {
        dispatch(createGaugeVoteModule(newId));
      } else {
        dispatch(deleteGaugeVoteModule(id));
      }
    }
  };
};

export { DumbModulesSection };

export default connect(mapStateToProps, mapDispatchToProps)(DumbModulesSection);