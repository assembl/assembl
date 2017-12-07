import React from 'react';
import { FormControl } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

export const TxtAreaWithRemainingChars = ({
  value,
  label,
  maxLength,
  rows,
  handleTxtChange,
  remainingChars,
  handleInputFocus,
  domId,
  textareaRef
}) => (
  <div>
    {value ? <div className="form-label">{label}</div> : null}
    <FormControl
      className="txt-area"
      componentClass="textarea"
      placeholder={label}
      maxLength={maxLength}
      rows={rows}
      value={value}
      onFocus={handleInputFocus || null}
      onChange={handleTxtChange}
      id={domId || 'txtarea'}
      inputRef={textareaRef}
    />
    <div className="annotation margin-xs">
      <Translate value="debate.remaining_x_characters" nbCharacters={remainingChars < 10000 ? remainingChars : maxLength} />
    </div>
  </div>
);