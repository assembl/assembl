// @flow
import * as React from 'react';
import { I18n } from 'react-redux-i18n';

import { browserHistory } from '../../router';
import { displayAlert } from '../../utils/utilityManager';
import DeleteSynthesisButton from '../administration/synthesis/deleteSynthesisButton';
import { connectedUserIsAdmin } from '../../utils/permissions';
import { get as getLink } from '../../utils/routeMap';
import ResponsiveOverlayTrigger from '../common/responsiveOverlayTrigger';
import { deleteSynthesisTooltip, editSynthesisTooltip } from '../common/tooltips';
import EditPostButton from '../debate/common/editPostButton';
import { getDiscussionSlug } from '../../utils/globalFunctions';

function userCanEdit() {
  return connectedUserIsAdmin() || false;
}

function userCanDelete() {
  return connectedUserIsAdmin() || false;
}

const handleEdit = (synthesisPostId: string) => {
  const slug = getDiscussionSlug();
  browserHistory.push(getLink('editSynthesis', { slug: slug, synthesisId: synthesisPostId }));
};

export function editButton(synthesisPostId: string) {
  if (!userCanEdit()) {
    return '';
  }
  return (
    <li>
      <ResponsiveOverlayTrigger placement="left" tooltip={editSynthesisTooltip}>
        <EditPostButton handleClick={() => handleEdit(synthesisPostId)} linkClassName="edit" />
      </ResponsiveOverlayTrigger>
    </li>
  );
}

// Define callback functions
const deleteCallback = () => {
  displayAlert('success', I18n.t('debate.syntheses.deleteSuccessMessage'));
};

export function deleteButton(synthesisPostId: string, refetchQueries: Array<any> = []) {
  if (!userCanDelete()) {
    return <></>;
  }
  return (
    <li>
      <ResponsiveOverlayTrigger placement="left" tooltip={deleteSynthesisTooltip}>
        <DeleteSynthesisButton
          synthesisPostId={synthesisPostId}
          modalBodyMessage="debate.syntheses.confirmDeletionBody"
          refetchQueries={refetchQueries}
          onDeleteCallback={deleteCallback}
        />
      </ResponsiveOverlayTrigger>
    </li>
  );
}