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
        ? <div className={readOnly ? 'hidden' : 'form-label'}>
          {label}
        </div>
        : null}
      {readOnly
        ? <h3 className="dark-title-3">
          {value}
        </h3>
        : <FormControl
          type="text"
          placeholder={label}
          maxLength={maxLength}
          value={value}
          onFocus={handleInputFocus || null}
          onChange={handleTxtChange}
        />}
      {!readOnly
        ? <div className="annotation margin-xs">
          <Translate value="debate.remaining_x_characters" nbCharacters={remainingChars < 10000 ? remainingChars : maxLength} />
        </div>
        : <div className="margin-m" />}
    </div>
  );
};