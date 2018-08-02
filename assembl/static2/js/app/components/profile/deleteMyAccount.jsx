// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, Checkbox, Button } from 'react-bootstrap';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import Helper from '../common/helper';
import { displayAlert, displayModal, closeModal } from '../../utils/utilityManager';
import { get, getContextual } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import deleteUserMutation from '../../graphql/mutations/deleteUser.graphql';
import userQuery from '../../graphql/userQuery.graphql';

type Props = {
  id: string,
  deleteUser: Function
};

type State = {
  checked: boolean
};

class DeleteMyAccount extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = { checked: false };
  }

  displayConfirmationModal() {
    const body = <Translate value="profile.deleteMyAccountModal" />;
    const footer = [
      <Button key="cancel" id="cancel-deleting-button" onClick={closeModal} className="button-cancel button-dark">
        <Translate value="cancel" />
      </Button>,
      <Button key="delete" id="confirm-deleting-button" onClick={this.deleteMyAccount} className="button-submit button-dark">
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
    const { id, deleteUser } = this.props;
    const variables = {
      id: id
    };
    const slug = getDiscussionSlug();
    deleteUser({ variables: variables })
      .then(() => {
        window.location.href = `${getContextual('oldLogout', { slug: slug })}?next=${get('home', { slug: slug })}`;
        displayAlert('success', I18n.t('accountDeleted'));
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
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
              <Checkbox id="delete-account-checkbox" checked={checked} onChange={this.toggleDeleteMyAccount}>
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
                id="delete-account-button"
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

const mapStateToProps = ({ context: { connectedUserIdBase64 } }) => ({
  id: connectedUserIdBase64
});

export default compose(
  connect(mapStateToProps),
  graphql(deleteUserMutation, {
    name: 'deleteUser'
  }),
  graphql(userQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return { loading: true };
      }
      if (data.error) {
        return { error: data.error };
      }
      return {
        displayName: data.user.displayName,
        isDeleted: data.user.isDeleted
      };
    }
  })
)(DeleteMyAccount);