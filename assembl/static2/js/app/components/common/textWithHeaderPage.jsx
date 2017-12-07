// @flow
import React from 'react';
import { connect } from 'react-redux';
import Header from './header';

export type TextWithHeaderPageProps = {
  headerTitle: string,
  text: string,
  debateData: Object
};

const DumbTextWithHeaderPage = (props: TextWithHeaderPageProps) => {
  const { headerTitle, text, debateData } = props;
  return (
    <div className="text-with-header">
      <Header title={headerTitle} imgUrl={debateData.headerBackgroundUrl} />
      <div className="max-container margin-xxl">
        <div className="page-body">
          <div
            className="ellipsis-content justify"
            dangerouslySetInnerHTML={{
              __html: text
            }}
          />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  debateData: state.debate.debateData
});

export { DumbTextWithHeaderPage };

export default connect(mapStateToProps)(DumbTextWithHeaderPage);