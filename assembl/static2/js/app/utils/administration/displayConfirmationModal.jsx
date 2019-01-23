// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';
import { displayModal, closeModal } from '../utilityManager';
import type { TInitialValues } from '../../components/form/LoadSaveReinitializeForm';

// This is a generic function to display a modal in
// an administration form when a confirmation of the changes is required
export const displayConfirmationModal = (values: TInitialValues, save: Function, warningMessageKey: string) => {
  const body = <Translate value={warningMessageKey} />;
  const footer = [
    <Button key="cancel" id="cancel-deleting-button" onClick={closeModal} className="button-cancel button-dark">
      <Translate value="cancel" />
    </Button>,
    <Button
      key="delete"
      id="confirm-deleting-button"
      onClick={() => {
        save(values);
        closeModal();
      }}
      className="button-submit button-dark"
    >
      <Translate value="validate" />
    </Button>
  ];
  const includeFooter = true;
  return displayModal(null, body, includeFooter, footer);
};