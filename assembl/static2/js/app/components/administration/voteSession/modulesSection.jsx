// @flow
import * as React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Checkbox, SplitButton, MenuItem, Radio } from 'react-bootstrap';
import range from 'lodash/range';

import SectionTitle from '../sectionTitle';
import Helper from '../../common/helper';
import TokensForm from './tokensForm';
import GaugeForm from './gaugeForm';
import {
  createTokenVoteModule,
  createTokenVoteCategory,
  createGaugeVoteModule,
  createGaugeVoteChoice,
  deleteVoteModule,
  undeleteModule,
  updateVoteSessionPageSeeCurrentVotes
} from '../../../actions/adminActions/voteSession';
import { createRandomId } from '../../../utils/globalFunctions';

type ModulesSectionProps = {
  tokenModules: Object,
  gaugeModules: Object,
  editLocale: string,
  toggleModuleCheckbox: Function,
  handleDeleteGauge: (id: string) => void,
  handleGaugeSelectChange: Function,
  handleSeeCurrentVotesChange: Function,
  seeCurrentVotes: boolean
};

const DumbModulesSection = ({
  tokenModules,
  editLocale,
  gaugeModules,
  handleDeleteGauge,
  handleGaugeSelectChange,
  handleSeeCurrentVotesChange,
  seeCurrentVotes,
  toggleModuleCheckbox
}: ModulesSectionProps) => {
  const activeTokenModulesIds = tokenModules.filter(m => !m.get('_toDelete')).map(m => m.get('id'));
  const activeGaugeModulesIds = gaugeModules.filter(m => !m.get('_toDelete')).map(m => m.get('id'));
  const tokenModuleChecked = activeTokenModulesIds.size > 0;
  const gaugeModuleChecked = activeGaugeModulesIds.size > 0;

  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.voteSession.1')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <div className="form-container">
          <div className="vote-modules-form">
            <Checkbox
              id="token-checkbox"
              checked={tokenModuleChecked}
              onChange={() => {
                toggleModuleCheckbox(tokenModuleChecked, tokenModules, 'tokens');
              }}
            >
              <Helper
                label={I18n.t('administration.voteWithTokens')}
                helperUrl="/static2/img/helpers/helper4.png"
                helperText={I18n.t('administration.tokenVoteCheckbox')}
                classname="inline checkbox-title"
              />
            </Checkbox>
            {activeTokenModulesIds.map(id => <TokensForm key={id} id={id} editLocale={editLocale} />)}
            {(tokenModuleChecked || gaugeModuleChecked) && <div className="separator" />}
            <Checkbox
              id="gauge-checkbox"
              checked={gaugeModuleChecked}
              onChange={() => {
                toggleModuleCheckbox(gaugeModuleChecked, gaugeModules, 'gauge');
              }}
            >
              <Helper
                label={I18n.t('administration.voteWithGauges')}
                helperUrl="/static2/img/helpers/helper3.png"
                helperText={I18n.t('administration.gaugeVoteCheckbox')}
                classname="inline checkbox-title"
              />
            </Checkbox>
            {gaugeModuleChecked ? (
              <div className="module-form">
                <div className="flex">
                  <label htmlFor="input-dropdown-addon">
                    <Translate value="administration.gaugeNumber" />
                  </label>
                  <Helper helperUrl="/static2/img/helpers/helper2.jpg" helperText={I18n.t('administration.defineGaugeNumer')} />
                </div>
                <SplitButton
                  className="admin-dropdown"
                  title={activeGaugeModulesIds.size}
                  id="input-dropdown-addon"
                  required
                  onSelect={(eventKey) => {
                    handleGaugeSelectChange(eventKey, activeGaugeModulesIds);
                  }}
                >
                  {range(0, 11).map(value => (
                    <MenuItem key={`gauge-item-${value}`} eventKey={value}>
                      {value}
                    </MenuItem>
                  ))}
                </SplitButton>
              </div>
            ) : null}
            {activeGaugeModulesIds.map((id, index) => (
              <GaugeForm key={id} handleDeleteGauge={handleDeleteGauge} index={index} id={id} editLocale={editLocale} />
            ))}
            {(tokenModuleChecked || gaugeModuleChecked) && (
              <div className="margin-m">
                <label htmlFor="seeCurrentVotes">
                  <Translate value="administration.seeCurrentVotes" />
                </label>
                <Radio
                  id="seeCurrentVotes"
                  onChange={() => {
                    handleSeeCurrentVotesChange(true);
                  }}
                  checked={seeCurrentVotes}
                  name="seeCurrentVotes"
                >
                  <Translate value="administration.resultsVisible" />
                </Radio>
                <Radio
                  onChange={() => {
                    handleSeeCurrentVotesChange(false);
                  }}
                  checked={!seeCurrentVotes}
                  name="seeCurrentVotes"
                >
                  <Translate value="administration.resultsNotVisible" />
                </Radio>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = ({ admin }) => {
  const { modulesInOrder, modulesById, page } = admin.voteSession;
  const { editLocale } = admin;
  return {
    tokenModules: modulesInOrder.map(id => modulesById.get(id)).filter(m => m.get('type') === 'tokens'),
    gaugeModules: modulesInOrder.map(id => modulesById.get(id)).filter(m => m.get('type') === 'gauge'),
    editLocale: editLocale,
    seeCurrentVotes: page.get('seeCurrentVotes')
  };
};

const mapDispatchToProps = (dispatch) => {
  const createGaugeVoteModuleWithChoices = (newId) => {
    dispatch(createGaugeVoteModule(newId));
    dispatch(createGaugeVoteChoice(newId, createRandomId()));
    dispatch(createGaugeVoteChoice(newId, createRandomId()));
  };

  const createTokenVoteModuleWithCategories = (newId) => {
    dispatch(createTokenVoteModule(newId));
    dispatch(createTokenVoteCategory(createRandomId(), newId));
  };

  return {
    toggleModuleCheckbox: (checked, tokenModules, moduleType) => {
      if (!checked) {
        if (tokenModules.size > 0) {
          tokenModules.forEach((m) => {
            dispatch(undeleteModule(m.get('id')));
          });
        } else {
          const newId = createRandomId();
          const dispatchCreateActions =
            moduleType === 'tokens' ? createTokenVoteModuleWithCategories : createGaugeVoteModuleWithChoices;
          dispatchCreateActions(newId);
        }
      } else {
        tokenModules.forEach((m) => {
          dispatch(deleteVoteModule(m.get('id')));
        });
      }
    },
    handleGaugeSelectChange: (selectedNumber, activeGaugeModulesIds) => {
      if (selectedNumber > activeGaugeModulesIds.size) {
        const numberToCreate = selectedNumber - activeGaugeModulesIds.size;
        for (let i = 0; i < numberToCreate; i += 1) {
          createGaugeVoteModuleWithChoices(createRandomId());
        }
      } else {
        const numberToDelete = activeGaugeModulesIds.size - selectedNumber;
        activeGaugeModulesIds.reverse().forEach((id, index) => {
          if (numberToDelete > index) {
            dispatch(deleteVoteModule(id));
          }
        });
      }
    },
    handleDeleteGauge: (id) => {
      dispatch(deleteVoteModule(id));
    },
    handleSeeCurrentVotesChange: checked => dispatch(updateVoteSessionPageSeeCurrentVotes(checked))
  };
};

export { DumbModulesSection };

export default connect(mapStateToProps, mapDispatchToProps)(DumbModulesSection);