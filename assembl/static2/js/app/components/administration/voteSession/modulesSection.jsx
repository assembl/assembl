// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import TextWithHelper from '../../common/textWithHelper';
import TokensForm from './tokensForm';
import { createTokenVoteModule } from '../../../actions/adminActions/voteSession';

type ModulesSectionProps = {
  tokenModules: Object,
  editLocale: string,
  tokenTypesNumber: Number,
  handleCheckBoxChange: Function
};

const ModulesSection = ({ tokenModules, editLocale, tokenTypesNumber, handleCheckBoxChange }: ModulesSectionProps) => {
  const checked = tokenModules.size > 0;
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.voteSession.1')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <div className="form-container">
          <div>
            <Checkbox
              checked={checked}
              onChange={() => {
                handleCheckBoxChange(checked);
              }}
            >
              <TextWithHelper
                text="Vote par jetons"
                helperUrl="/static2/img/helpers/helper2.png"
                helperText="Description of the module"
                classname="inline"
              />
            </Checkbox>
            {tokenModules.map(id => <TokensForm key={id} id={id} editLocale={editLocale} tokenTypesNumber={tokenTypesNumber} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = ({ admin }) => {
  const { modulesInOrder, modulesById, tokenTypesInOrder } = admin.voteSession;
  const { editLocale } = admin;
  return {
    tokenModules: modulesInOrder.filter(id => modulesById.get(id).get('type') === 'tokens'),
    editLocale: editLocale,
    tokenTypesNumber: tokenTypesInOrder.size
  };
};

const mapDispatchToProps = (dispatch) => {
  const newId = Math.round(Math.random() * -1000000).toString();
  return {
    handleCheckBoxChange: (checked) => {
      if (!checked) {
        dispatch(createTokenVoteModule(newId));
      } else {
        console.log('delete');
      }
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ModulesSection);