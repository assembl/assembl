// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { Checkbox, FormGroup } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import TextWithHelper from '../../common/textWithHelper';
import { getEntryValueForLocale } from '../../../utils/i18n';

const ModulesSection = () => (
  <div className="admin-box">
    <SectionTitle title={I18n.t('administration.voteSession.1')} annotation={I18n.t('administration.annotation')} />
    <div className="admin-content">
      <FormGroup>
        <Checkbox checked={false}>
          <TextWithHelper
            text="Module name"
            helperUrl="/static2/img/helpers/helper2.pngq"
            helperText="Description of the module"
            classname="title"
            // Todo: Create a CSS class for this label and replace "title"
          />
        </Checkbox>
      </FormGroup>
    </div>
  </div>
);

const mapStateToProps = (state, { editLocale }) => {
  const voteSession = state.admin.voteSession;
  const instructionsContent = getEntryValueForLocale(voteSession.get('instructionsSectionContentEntries'), editLocale);

  return {
    headerTitle: getEntryValueForLocale(voteSession.get('titleEntries'), editLocale),
    headerSubtitle: getEntryValueForLocale(voteSession.get('subTitleEntries'), editLocale),
    instructionsTitle: getEntryValueForLocale(voteSession.get('instructionsSectionTitleEntries'), editLocale),
    instructionsContent: instructionsContent ? instructionsContent.toJS() : null,
    propositionSectionTitle: getEntryValueForLocale(voteSession.get('propositionsSectionTitleEntries'), editLocale),
    headerImgUrl: voteSession.getIn(['headerImage', 'externalUrl']),
    headerImgMimeType: voteSession.getIn(['headerImage', 'mimeType']),
    publicVote: voteSession.get('publicVote')
  };
};

export default connect(mapStateToProps)(ModulesSection);