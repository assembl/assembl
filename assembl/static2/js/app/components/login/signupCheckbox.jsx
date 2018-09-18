import * as React from 'react';
import { FormGroup, Checkbox } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

const SignupCheckbox = (props) => {
  const { checked, displayLegalFormModal, toggleCheck, legalContentsType, text } = props;
  return (
    <FormGroup className="left margin-left-2">
      <Checkbox checked={checked} type="checkbox" onChange={() => toggleCheck(legalContentsType)} required inline>
        <Translate value={`${legalContentsType}.iAccept`} />
        <a
          onClick={(e) => {
            e.preventDefault();
            displayLegalFormModal(checked, text, legalContentsType);
          }}
        >
          <Translate value={`${legalContentsType}.link`} className="terms-link" />
        </a>
      </Checkbox>
    </FormGroup>
  );
};

export default SignupCheckbox;