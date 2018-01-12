// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import TextWithHelper from '../../common/textWithHelper';
import TokensForm from './tokensForm';

const ModulesSection = ({ tokenModules, editLocale }) => {
  const checked = true;
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
              {checked ? <TokensForm key={id} id={id} editLocale={editLocale} /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = ({ admin }) => {
  const { modulesInOrder, modulesById } = admin.voteSession;
  const { editLocale } = admin;

  return {
    tokenModules: modulesInOrder.filter(id => modulesById.get(id).get('type') === 'tokens'),
    editLocale: editLocale
  };
};

export default connect(mapStateToProps)(ModulesSection);