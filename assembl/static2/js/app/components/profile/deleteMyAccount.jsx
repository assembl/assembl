// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, Checkbox, Button } from 'react-bootstrap';
import Helper from '../common/helper';
import { displayModal, closeModal } from '../../utils/utilityManager';

type DeleteMyAccountState = {
  checked: boolean
};

class DeleteMyAccount extends React.Component<void, *, DeleteMyAccountState> {
  state: DeleteMyAccountState;

  constructor() {
    super();
    this.state = { checked: false };
  }

  displayConfirmationModal() {
    const body = <Translate value="profile.deleteMyAccountModale" />;
    const footer = [
      <Button key="delete" onClick={this.deleteMyAccount} className="button-submit button-dark">
        <Translate value="validate" />
      </Button>
    ];
    const includeFooter = true;

    return displayModal(null, body, includeFooter, footer);
  }

  toggleDeleteMyAccount = (): void => {
    this.setState({ checked: !this.state.checked });
  };

  deleteMyAccount = (): void => {
    closeModal();
    console.log('delete my account mutation'); // eslint-disable-line
  };

  handleDeleteClick = (): void => {
    this.displayConfirmationModal();
  };

  render() {
    const { checked } = this.state;
    return (
      <div>
        <h2 className="dark-title-2 margin-l">
          <Translate value="profile.deleteMyAccount" />
        </h2>
        <div className="profile-form">
          <form>
            <FormGroup>
              <Checkbox checked={checked} onChange={this.toggleDeleteMyAccount}>
                <div style={{ marginTop: '-16px' }}>
                  <Helper
                    label={I18n.t('profile.deleteMyAccountConfirmation')}
                    helperText={I18n.t('profile.deleteMyAccountText')}
                    classname="text"
                  />
                </div>
              </Checkbox>
            </FormGroup>
            <div className="center margin-l">
              <Button
                disabled={!checked}
                className="button-submit button-dark"
                onClick={this.handleDeleteClick}
                style={!checked ? { opacity: '0.5' } : null}
              >
                <Translate value="delete" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default DeleteMyAccount;