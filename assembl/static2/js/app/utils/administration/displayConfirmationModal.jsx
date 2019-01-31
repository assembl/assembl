// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';
import { displayModal, closeModal } from '../utilityManager';

// This is a generic function to display a modal in
// an administration form when a confirmation of the changes is required
export const displayConfirmationModal = (callback: Function, messageKey: string) => {
  const body = <Translate value={messageKey} />;
  const footer = [
    <Button key="cancel" id="cancel-deleting-button" onClick={closeModal} className="button-cancel button-dark">
      <Translate value="cancel" />
    </Button>,
    <Button
      key="delete"
      id="confirm-deleting-button"
      onClick={() => {
        callback();
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