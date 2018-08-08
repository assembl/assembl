// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import Header from './header';

export type TextWithHeaderPageProps = {
  headerTitle: string,
  text: string,
  debateData: Object,
  renderPageBody: Function
};

type State = {};

class DumbTextWithHeaderPage extends React.Component<TextWithHeaderPageProps, State> {
  static defaultProps = {
    renderPageBody: text => (<div
      className="ellipsis-content justify"
      dangerouslySetInnerHTML={{
        __html: text
      }}
    />)
  }

  render() {
    const { headerTitle, debateData, renderPageBody, text } = this.props;
    return (
      <div className="text-with-header">
        <Header title={headerTitle} imgUrl={debateData.headerBackgroundUrl} />
        <div className="max-container margin-xxl">
          { renderPageBody(text) }
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  debateData: state.debate.debateData
});

export { DumbTextWithHeaderPage };

export default connect(mapStateToProps)(DumbTextWithHeaderPage);