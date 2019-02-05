// @flow
import React from 'react';
import { FormControl } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

type Props = {
  alwaysDisplayLabel: boolean,
  value: string,
  label: boolean,
  maxLength: number,
  handleTxtChange: (SyntheticInputEvent<HTMLInputElement>) => void,
  handleInputFocus?: ?(SyntheticInputEvent<HTMLInputElement>) => void,
  isActive?: boolean,
  name: string
};

export const TextInputWithRemainingChars = ({
  alwaysDisplayLabel,
  value,
  label,
  maxLength,
  handleTxtChange,
  handleInputFocus,
  isActive,
  name
}: Props) => {
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
        ) : null}
      </div>
    </div>
  );
};

TextInputWithRemainingChars.defaultProps = {
  alwaysDisplayLabel: false,
  isActive: false,
  handleInputFocus: null
};