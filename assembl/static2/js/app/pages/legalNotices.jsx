import React from 'react';
import { graphql } from 'react-apollo';
import LargeTextParagraph from '../components/common/largeTextParagraph';
import LegalNoticesQuery from '../graphql/LegalNoticesQuery.graphql';

const LegalNotices = ({ text, title }) => {
  return <LargeTextParagraph headerTitle={title} text={text} />;
};

export default graphql(LegalNoticesQuery, {
  props: ({ data }) => {
    return {
      text: data.text,
      title: data.title
    };
  }
})(LegalNotices);