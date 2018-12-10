// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Modal, FormGroup, Checkbox, Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

import { legalContentSlugs, ESSENTIAL_SIGNUP_COOKIES as LEGAL_CONTENTS_TO_ACCEPT } from '../../constants';
import manageErrorAndLoading from './../../components/common/manageErrorAndLoading';
import { getRouteLastString, getDiscussionSlug } from '../../utils/globalFunctions';
import { get, getContextual } from '../../utils/routeMap';

import LegalContentsLinksList from './legalContentsLinksList';

// GraphQL imports
import TabsConditionQuery from './../../graphql/TabsConditionQuery.graphql';
import updateAcceptedCookies from './../../graphql/mutations/updateAcceptedCookies.graphql';
import acceptedCookiesQuery from './../../graphql/acceptedCookiesQuery.graphql';

type LegalContentsArray = Array<string>;

type Props = {
  pathname: string,
  userId: string,
  hasTermsAndConditions: boolean,
  hasPrivacyPolicy: boolean,
  hasUserGuidelines: boolean,
  acceptedLegalContentsList: LegalContentsArray,
  updateAcceptedCookies: Function
};

type State = {
  showModal: boolean,
  modalCheckboxIsChecked: boolean
};

export class DumbAcceptCookiesModal extends React.PureComponent<Props, State> {
  state = {
    modalCheckboxIsChecked: false,
    showModal: false
  };

  componentDidMount() {
    this.showModal();
  }

  showModal = () => {
    const { userId, pathname, acceptedLegalContentsList } = this.props;
    if (userId) {
      const lastRouteString = getRouteLastString(pathname);
      const isOnLegalContentPage = legalContentSlugs.includes(lastRouteString);
      // This array gathers all the legal contents to accept by their 'ACCEPT_...' formatted name
      const legalContentsToAcceptByCookieName = this.getLegalContentsToAccept();

      const userHasAcceptedAllLegalContents = legalContentsToAcceptByCookieName.every(legalContent =>
        acceptedLegalContentsList.includes(legalContent)
      );
      // The modal is only showed to a user who is connected but hasn't yet accepted legal contents and isn't currently reading them
      if (!isOnLegalContentPage && !userHasAcceptedAllLegalContents) {
        this.setState({ showModal: true });
      }
    }
  };

  handleModalCheckbox = () => {
    this.setState(prevState => ({
      modalCheckboxIsChecked: !prevState.modalCheckboxIsChecked
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
    this.setState({ showModal: false });
  };

  render() {
    const { hasTermsAndConditions, hasPrivacyPolicy, hasUserGuidelines } = this.props;
    const { showModal, modalCheckboxIsChecked } = this.state;
    const slug = getDiscussionSlug();
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

    return cleanLegalContentsArray ? (
      <Modal show={showModal} backdrop="static">
        <Modal.Header>
          <Modal.Title>
            <Translate value="legalContentsModal.title" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup className="justify">
            <Checkbox onChange={this.handleModalCheckbox} checked={modalCheckboxIsChecked} type="checkbox" inline>
              <Translate value="legalContentsModal.iAccept" /> {/* $FlowFixMe */}
              <LegalContentsLinksList legalContentsList={cleanLegalContentsArray} />
            </Checkbox>
          </FormGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button
            key="cancel"
            onClick={this.closeModal}
            className="button-cancel button-dark"
            href={`${getContextual('oldLogout', { slug: slug })}?next=${get('home', { slug: slug })}`}
          >
            <Translate value="refuse" />
          </Button>
          <Button
            disabled={!modalCheckboxIsChecked}
            key="accept"
            className="button-submit button-dark"
            onClick={() => {
              this.acceptAllLegalContents();
              this.closeModal();
            }}
          >
            <Translate value="accept" />
          </Button>
        </Modal.Footer>
      </Modal>
    ) : null;
  }
}

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  userId: state.context.connectedUserIdBase64
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
)(DumbAcceptCookiesModal);