// @noflow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import { Modal, Button } from 'react-bootstrap';
import { compose, graphql } from 'react-apollo';
import get from 'lodash/get';
import type { OperationComponent, QueryProps } from 'react-apollo';
import { closeModal } from '../../utils/utilityManager';
import LegalContents from '../../graphql/LegalContents.graphql';
import withLoadingIndicator from '../../components/common/withLoadingIndicator';

type TermsFormProps = {
  isChecked: boolean,
  text: string,
  handleAcceptButton: () => void,
  style: Object
};

type TermsFormState = {
  isScrolled: boolean
};

class DumbTermsForm extends React.Component<TermsFormProps, TermsFormState> {
  box: ?HTMLElement;

  handleSubmit: () => void;

  constructor() {
    super();
    this.state = {
      isScrolled: false
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.box.addEventListener('scroll', this.trackScrolling);
  }

  trackScrolling = (): void => {
    const wrappedElement = this.box;
    if (wrappedElement.scrollHeight - wrappedElement.scrollTop === wrappedElement.clientHeight) {
      this.setState({
        isScrolled: true
      });
      wrappedElement.removeEventListener('scroll', this.trackScrolling);
    }
  };

  handleSubmit = () => {
    this.props.handleAcceptButton();
    closeModal();
  };

  render() {
    const { isScrolled } = this.state;
    const { isChecked, text, style = {} } = this.props;
    const termsBoxClasses = isChecked ? 'terms-box justify full-height' : 'terms-box justify';

    return (
      <div className="terms-form" style={style}>
        <Modal.Header closeButton>
          <Modal.Title>
            <Translate value="termsAndConditions.headerTitle" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            className={termsBoxClasses}
            ref={(box) => {
              this.box = box;
            }}
            dangerouslySetInnerHTML={{ __html: text }}
          />
          {isScrolled &&
            !isChecked && (
              <Button
                type="submit"
                name="acceptTerms"
                className="button-submit button-dark terms-submit right"
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

type OutputProps = {
  text?: string
};

export type Props = OutputProps & QueryProps & LegalContentsQuery;

export const mapDataToProps = ({ data }: Object) => {
  const text = get(data, 'legalContents.termsAndConditions', '');
  return {
    ...data,
    text: text
  };
};

const withData: OperationComponent<LegalContentsQuery, LegalContentsQueryVariables, Props> = graphql(LegalContents, {
  props: mapDataToProps
});

export { DumbTermsForm };

export default compose(withData, withLoadingIndicator())(DumbTermsForm);