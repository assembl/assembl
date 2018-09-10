// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import { Modal, Button } from 'react-bootstrap';
import { closeModal } from '../../utils/utilityManager';

type LegalFormProps = {
  checked: boolean,
  handleAcceptButton: Function,
  style?: Object,
  legalContentsType: string,
  text: string
};

type LegalFormState = {
  isScrolled: boolean
};

class LegalForm extends React.Component<LegalFormProps, LegalFormState> {
  box: ?HTMLDivElement;

  static defaultProps = {
    style: {}
  };

  state = {
    isScrolled: false
  };

  componentDidMount() {
    return this.box && this.box.addEventListener('scroll', this.trackScrolling);
  }

  trackScrolling = () => {
    const wrappedElement = this.box;
    if (wrappedElement && wrappedElement.scrollHeight - wrappedElement.scrollTop === wrappedElement.clientHeight) {
      this.setState({
        isScrolled: true
      });
      if (wrappedElement) {
        wrappedElement.removeEventListener('scroll', this.trackScrolling);
      }
    }
  };

  handleSubmit = (legalContentsType: string) => {
    this.props.handleAcceptButton(legalContentsType);
    closeModal();
  };

  render() {
    const { isScrolled } = this.state;
    const { checked, text, style, legalContentsType } = this.props;
    const boxClasses = checked ? 'terms-box justify full-height' : 'terms-box justify';

    return (
      <div className="terms-form" style={style}>
        <Modal.Header closeButton>
          <Modal.Title>
            <Translate value={`${legalContentsType}.headerTitle`} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            className={boxClasses}
            ref={(box) => {
              this.box = box;
            }}
            dangerouslySetInnerHTML={{ __html: text }}
          />
          {isScrolled &&
            !checked && (
              <Button
                type="submit"
                name="acceptTerms"
                className="button-submit button-dark terms-submit right"
                onClick={() => {
                  this.handleSubmit(legalContentsType);
                }}
              >
                <Translate value="termsAndConditions.accept" />
              </Button>
            )}
        </Modal.Body>
      </div>
    );
  }
}

export default LegalForm;