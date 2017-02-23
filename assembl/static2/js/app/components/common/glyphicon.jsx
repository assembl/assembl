import React from 'react';

class Glyphicon extends React.Component {
  render() {
    const glyph = this.props.glyph;
    const color = this.props.color;
    const size = this.props.size;
    const desc = this.props.desc;
    return (
      <img width={`${size}px`} height={`${size}px`} src={`../../../../static2/img/icons/${color}/${glyph}.svg`} alt={desc} />
    );
  }
}

export default Glyphicon;