import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Modal, Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { closeModal } from '../../utils/utilityManager';
import LegalNoticeAndTerms from '../../graphql/LegalNoticeAndTerms.graphql';
import withLoadingIndicator from '../../components/common/withLoadingIndicator';

class TermsForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isScrolled: false
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const wrappedElement = document.getElementById('box');
    wrappedElement.addEventListener('scroll', (event) => {
      const element = event.target;
      if (element.scrollHeight - element.scrollTop === element.clientHeight) {
        this.setState({
          isScrolled: true
        });
      }
    });
  }

  handleSubmit() {
    this.props.handleAcceptButton();
    closeModal();
  }

  render() {
    const { isScrolled } = this.state;
    const { isChecked, text } = this.props;
    return (
      <div className="terms-form">
        <Modal.Header closeButton>
          <Modal.Title>
            <Translate value="termsAndConditions.headerTitle" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="terms-box justify" id="box" dangerouslySetInnerHTML={{ __html: text }} />
          {isScrolled &&
            !isChecked && (
              <Button
                type="submit"
                name="acceptTerms"
                className="button-submit button-dark terms-submit"
                onClick={this.handleSubmit}
              >
                <Translate value="termsAndConditions.accept" />
              </Button>
            )}
        </Modal.Body>
      </div>
    );
  }
}

export const mapStateToProps = state => ({
  lang: state.i18n.locale
});

const withData = graphql(LegalNoticeAndTerms, {
  props: ({ data }) => {
    const text = data.legalNoticeAndTerms ? data.legalNoticeAndTerms.termsAndConditions : '';
    return {
      ...data,
      text: text
    };
  }
});

export default compose(connect(mapStateToProps), withData, withLoadingIndicator())(TermsForm);