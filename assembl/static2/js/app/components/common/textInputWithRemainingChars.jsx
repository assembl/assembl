import React from 'react';
import { FormControl } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

export const TextInputWithRemainingChars = ({
  alwaysDisplayLabel = false,
  value,
  label,
  maxLength,
  handleTxtChange,
  handleInputFocus,
  isActive,
  name
}) => {
  const remainingChars = maxLength - value.length;
  return (
    <div>
      {alwaysDisplayLabel || value ? <div className="form-label input-title-label">{label}</div> : null}
      <FormControl
        type="text"
        placeholder={label}
        maxLength={maxLength}
        value={value}
        onFocus={handleInputFocus || null}
        onChange={handleTxtChange}
        name={name}
      />
      <div className="annotation margin-xs">
        {isActive ? (
          <Translate value="debate.remaining_x_characters" nbCharacters={remainingChars < 10000 ? remainingChars : maxLength} />
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    </div>
  );
};