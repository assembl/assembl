import React from 'react';
import { FormControl } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

export const TextInputWithRemainingChars = ({ value, label, maxLength, handleTxtChange, remainingChars, handleInputFocus }) => {
  return (
    <div>
      {value
        ? <div className="form-label">
          {label}
        </div>
        : null}
      <FormControl
        type="text"
        placeholder={label}
        maxLength={maxLength}
        value={value}
        onFocus={handleInputFocus || null}
        onChange={handleTxtChange}
      />
      <div className="annotation margin-xs">
        <Translate value="debate.remaining_x_characters" nbCharacters={remainingChars < 10000 ? remainingChars : maxLength} />
      </div>
    </div>
  );
};