import React from 'react';
import { TwitterPicker } from 'react-color';

class ColorPicker extends React.Component {
  render() {
    const { colors, onColorChange } = this.props;
    return (
      <div className="color-picker">
        <TwitterPicker colors={colors} onChange={onColorChange} />
      </div>
    );
  }
}

export default ColorPicker;