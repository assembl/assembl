// @flow
import * as React from 'react';

type CardProps = {
  className: string,
  imgUrl: string,
  children: React.Node
};

class Card extends React.Component<CardProps> {
  render() {
    const { className, imgUrl, children } = this.props;
    return (
      <div className={`illustration-box ${className || ''}`}>
        <div className="image-box" style={imgUrl ? { backgroundImage: `url(${imgUrl})` } : null} />
        {children}
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

export default Card;