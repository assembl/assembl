// @flow
import React from 'react';
import { FormControl } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

type Props = {
  domId: string,
  maxLength: number,
  placeholder: string,
  rows: number,
  onChange: Function,
  onClick: Function,
  value: string
};

const TextAreaWithRemainingChars = ({ domId, maxLength, placeholder, rows, onChange, onClick, value }: Props) => {
  const remainingChars = maxLength - value.length;
  return (
    <div>
      <FormControl
        className="txt-area"
        componentClass="textarea"
        id={domId}
        maxLength={maxLength}
        onChange={onChange}
        onClick={onClick}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
      <div className="annotation margin-xs">
        <Translate value="debate.remaining_x_characters" nbCharacters={remainingChars} />
      </div>
    </div>
  );
};

TextAreaWithRemainingChars.defaultProps = {
  maxLength: 1000
};

export default TextAreaWithRemainingChars;