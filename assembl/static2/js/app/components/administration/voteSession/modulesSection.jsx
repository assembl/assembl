// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import TextWithHelper from '../../common/textWithHelper';
import TokensForm from './tokensForm';

type ModulesSectionProps = {
  tokenModules: Object,
  editLocale: string,
  tokenTypesNumber: Number
};

const ModulesSection = ({ tokenModules, editLocale, tokenTypesNumber }: ModulesSectionProps) => {
  const checked = tokenModules.size > 0;
  const handleCheckBoxChange = () => {};
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.voteSession.1')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <div className="form-container">
          {tokenModules.map(id => (
            <div key={id}>
              <Checkbox checked={checked} onChange={handleCheckBoxChange}>
                <TextWithHelper
                  text="Vote par jetons"
                  helperUrl="/static2/img/helpers/helper2.png"
                  helperText="Description of the module"
                  classname="inline"
                />
              </Checkbox>
              {checked ? <TokensForm key={id} id={id} editLocale={editLocale} tokenTypesNumber={tokenTypesNumber} /> : null}
            </div>
          ))}
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

export default connect(mapStateToProps)(ModulesSection);