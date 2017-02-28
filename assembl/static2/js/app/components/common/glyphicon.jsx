import React from 'react';
import { I18n } from 'react-redux-i18n';

class Glyphicon extends React.Component {
  render() {
    const glyph = this.props.glyph;
    const color = this.props.color;
    const size = this.props.size;
    const desc = this.props.desc;
    return (
      <img width={`${size}px`} height={`${size}px`} src={`/static2/img/icons/${color}/${glyph}.svg`} alt={I18n.t(desc)} title={I18n.t(desc)} />
    );
  }
}

export default Glyphicon;