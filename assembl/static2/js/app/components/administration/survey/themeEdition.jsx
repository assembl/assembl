import React from 'react';

class themeEdition extends React.Component {
  render() {
    const { showSection } = this.props;
    return (
      <p className={showSection ? 'shown' : 'hidden'}>themeEdition assembl</p>
    );
  }
}

export default themeEdition;