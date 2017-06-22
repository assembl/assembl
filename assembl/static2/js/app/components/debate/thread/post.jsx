import React from 'react';

export default class Post extends React.Component {
  render() {
    const { subject, body } = this.props;
    return (
      <div className="theme-box">
        <p>{subject}</p>
        <p>{body}</p>
      </div>
    );
  }
}