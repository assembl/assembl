// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Modal, FormGroup, Checkbox, Button } from 'react-bootstrap';

import { legalContentSlugs, ESSENTIAL_SIGNUP_COOKIES as LEGAL_CONTENTS_TO_ACCEPT } from '../../constants';
import { legalConfirmModal } from '../../utils/utilityManager';
import manageErrorAndLoading from './../../components/common/manageErrorAndLoading';
import { getRouteLastString, getDiscussionSlug } from '../../utils/globalFunctions';
import { get, getContextual } from '../utils/routeMap';

import LegalContentsLinksList from './legalContentsLinksList';

// GraphQL imports
import TabsConditionQuery from './../../graphql/TabsConditionQuery.graphql';
import updateAcceptedCookies from './../../graphql/mutations/updateAcceptedCookies.graphql';
import acceptedCookiesQuery from './../../graphql/acceptedCookiesQuery.graphql';

type LegalContentsArray = Array<string>;

type Props = {
  pathname: string,
  id: string,
  hasTermsAndConditions: boolean,
  hasPrivacyPolicy: boolean,
  hasUserGuidelines: boolean,
  acceptedLegalContentList: LegalContentsArray,
  updateAcceptedCookies: Function
};

type State = {
  modalIsChecked: boolean
};

class AcceptCookiesModal extends React.Component<Props, State> {
  state = { 
      modalIsChecked: false,
      showModal: false
    };

  componentDidMount() {
    this.showModal();
  }

  componentDidUpdate() {
    this.showModal();
  }

  showModal = () => {
    // The modal is only showed to a user who is connected but hasn't yet accepted legal contents and isn't currently reading them
    if (!isOnLegalContentPage && !userHasAcceptedAllLegalContents && id) {
      this.setState({ showModal: true })
    }
  };

  handleModalCheckbox = () => {
    this.setState(prevState => ({
      modalIsChecked: !prevState.modalIsChecked
    }));
  };

  getLegalContentsToAccept = (): LegalContentsArray => {
    const { hasTermsAndConditions, hasPrivacyPolicy, hasUserGuidelines } = this.props;
    const legalContentsToAccept = {
      ACCEPT_CGU: hasTermsAndConditions,
      ACCEPT_PRIVACY_POLICY_ON_DISCUSSION: hasPrivacyPolicy,
      ACCEPT_USER_GUIDELINE_ON_DISCUSSION: hasUserGuidelines
    };
    const filteredLegalContentsToAccept = LEGAL_CONTENTS_TO_ACCEPT.filter(contentType => legalContentsToAccept[contentType]);
    return filteredLegalContentsToAccept;
  };

  acceptAllLegalContents = () => {
    const legalContentsToAccept = this.getLegalContentsToAccept();
    this.props.updateAcceptedCookies({
      variables: { actions: legalContentsToAccept }
    });
  };

  closeModal = () => {
      this.setState({ showModal: false})
  }

  render() {
      const { hasTermsAndConditions, hasPrivacyPolicy, hasUserGuidelines, acceptedLegalContentList, id, pathname } = this.props;
    const { showModal, modalIsChecked } = this.state;
      const slug = getDiscussionSlug();
      const lastRouteString = getRouteLastString(pathname);
    const isOnLegalContentPage = legalContentSlugs.includes(lastRouteString);
    const { modalIsChecked } = this.state;
    let userHasAcceptedAllLegalContents;
    // This array gathers all the legal contents to accept by their 'ACCEPT_...' formatted name
    const legalContentsToAcceptByCookieName = this.getLegalContentsToAccept();
    if (id) {
      userHasAcceptedAllLegalContents = legalContentsToAcceptByCookieName.every(legalContent =>
        acceptedLegalContentList.includes(legalContent)
      );
    }
    const legalContentsToAcceptByRouteName = {
      terms: hasTermsAndConditions,
      privacyPolicy: hasPrivacyPolicy,
      userGuidelines: hasUserGuidelines
    };
    const legalContentsArray = Object.keys(legalContentsToAcceptByRouteName).map(
      key => (legalContentsToAcceptByRouteName[key] ? key : null)
    );
    // This array gathers all the legal contents to accept by their route name
    const cleanLegalContentsArray = legalContentsArray.filter(el => el !== null);

    // TODO: deal with the backcross 'static' logic with this new Modal

      return (
          <Modal show={showModal}>
            <Modal.Header>
                <Modal.Title><Translate value="legalContentsModal.title" /></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FormGroup className="justify">
                    <Checkbox onChange={handleModalCheckbox} checked={modalIsChecked} type="checkbox" inline>
                        <Translate value="legalContentsModal.iAccept" />
                        <LegalContentsLinksList legalContentsList={cleanLegalContentsArray} />
                        <Translate value="legalContentsModal.iCanModify" />
                    </Checkbox>
                </FormGroup>
            </Modal.Body>
            <Modal.Footer>
                <div className="modal-footer">
                    <Button
      key="cancel"
      onClick={closeModal}
      className="button-cancel button-dark"
      href={`${getContextual('oldLogout', { slug: slug })}?next=${get('home', { slug: slug })}`}
    >
      <Translate value="refuse" />
    </Button>
    <Button
      disabled={!modalIsChecked}
      key="accept"
      className="button-submit button-dark"
      onClick={() => {
        try {
          this.acceptAllLegalContents();
        } catch (error) {
          console.error(error); // eslint-disable-line
        }
        this.closeModal();
      }}
    >
      <Translate value="accept" />
    </Button>
                </div>
            </Modal.Footer>
          </Modal>
      )
  }
}

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  id: state.context.connectedUserIdBase64
});

export default compose(
  connect(mapStateToProps),
  graphql(TabsConditionQuery, {
    props: ({ data: { hasTermsAndConditions, hasPrivacyPolicy, hasUserGuidelines } }) => ({
      hasTermsAndConditions: hasTermsAndConditions,
      hasPrivacyPolicy: hasPrivacyPolicy,
      hasUserGuidelines: hasUserGuidelines
    })
  }),
  graphql(updateAcceptedCookies, {
    name: 'updateAcceptedCookies'
  }),
  graphql(acceptedCookiesQuery, {
    skip: props => !props.id,
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        acceptedLegalContentList: data.user.acceptedCookies
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: false })
)(AcceptCookiesModal);