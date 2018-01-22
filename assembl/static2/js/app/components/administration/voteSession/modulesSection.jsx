// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import Helper from '../../common/helper';
import TokensForm from './tokensForm';
import { createTokenVoteModule, deleteTokenVoteModule } from '../../../actions/adminActions/voteSession';

type ModulesSectionProps = {
  tokenModules: Object,
  editLocale: string,
  handleCheckBoxChange: Function
};

const DumbModulesSection = ({ tokenModules, editLocale, handleCheckBoxChange }: ModulesSectionProps) => {
  const tokenModuleChecked = tokenModules.size > 0;
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.voteSession.1')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <div className="form-container">
          <div>
            <Checkbox
              checked={tokenModuleChecked}
              onChange={() => {
                handleCheckBoxChange(tokenModuleChecked, tokenModules[0]);
              }}
            >
              <Helper
                label={I18n.t('administration.voteWithTokens')}
                helperUrl="/static2/img/helpers/helper4.png"
                helperText={I18n.t('administration.tokenVoteCheckbox')}
                classname="inline"
              />
            </Checkbox>
            {tokenModules.map(id => <TokensForm key={id} id={id} editLocale={editLocale} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = ({ admin }) => {
  const { modulesInOrder, modulesById } = admin.voteSession;
  const { editLocale } = admin;
  return {
    tokenModules: modulesInOrder.filter(id => modulesById.getIn([id, 'type']) === 'tokens'),
    editLocale: editLocale
  };
};

const mapDispatchToProps = (dispatch) => {
  const newId = Math.round(Math.random() * -1000000).toString();
  return {
    handleCheckBoxChange: (checked, id) => {
      if (!checked) {
        dispatch(createTokenVoteModule(newId));
      } else {
        dispatch(deleteTokenVoteModule(id));
      }
    }
  };
};

export { DumbModulesSection };

export default connect(mapStateToProps, mapDispatchToProps)(DumbModulesSection);