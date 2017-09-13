import React from 'react';
import { FormControl } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

export const TextInputWithRemainingChars = ({
  alwaysDisplayLabel = false,
  value,
  label,
  readOnly,
  maxLength,
  handleTxtChange,
  handleInputFocus
}) => {
  const remainingChars = maxLength - value.length;
  return (
    <div>
      {alwaysDisplayLabel || value
        ? <div className="form-label">
          {label}
        </div>
        : null}
      {readOnly
        ? <span>
          {value}
        </span>
        : <FormControl
          type="text"
          placeholder={label}
          maxLength={maxLength}
          value={value}
          onFocus={handleInputFocus || null}
          onChange={handleTxtChange}
        />}
      <div className="annotation margin-xs">
        <Translate value="debate.remaining_x_characters" nbCharacters={remainingChars < 10000 ? remainingChars : maxLength} />
      </div>
    </div>
  );
};