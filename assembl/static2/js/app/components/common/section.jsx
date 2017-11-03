// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import { SECTION_INDEX_GENERATOR } from '../../utils/section';

type SectionProps = {
  title: string,
  index: number,
  displayIndex: boolean,
  indexGenerator: Function,
  parents: Array<number>,
  children: Array<*>
};

const level1 = (title, index) => {
  return (
    <div>
      <div className="title-hyphen">&nbsp;</div>
      <h1 className="section-title section-title1 dark-title-1">
        {index
          ? <span className="section-title-index">
            {index}
          </span>
          : null}
        <Translate value={title} />
      </h1>
    </div>
  );
};

const level2 = (title, index) => {
  return (
    <h2 className="section-title section-title-2 dark-title-1">
      {index
        ? <span className="section-title-index">
          {index}
        </span>
        : null}
      <Translate value={title} />
    </h2>
  );
};

const level3 = (title, index) => {
  return (
    <h3 className="section-title section-title-3 dark-title-1">
      {index
        ? <span className="section-title-index">
          {index}
        </span>
        : null}
      <Translate value={title} />
    </h3>
  );
};

const levelN = (title, index) => {
  return (
    <h3 className="section-title section-title-3 dark-title-1">
      {index
        ? <span className="section-title-index">
          {index}
        </span>
        : null}
      <Translate value={title} />
    </h3>
  );
};

const LEVELS = [level1, level2, level3];

class Section extends React.Component<Object, SectionProps, void> {
  props: SectionProps;

  static defaultProps = {
    index: 1,
    displayIndex: false,
    indexGenerator: SECTION_INDEX_GENERATOR.alphanumericOr,
    parents: []
  };

  getIndexes = () => {
    const { index, parents } = this.props;
    const indexes = parents.slice();
    indexes.push(index);
    return indexes;
  };

  getTitle = () => {
    const { title, parents, indexGenerator, displayIndex } = this.props;
    const titleRenderer = LEVELS[parents.length] || levelN;
    return titleRenderer(title, displayIndex && indexGenerator(this.getIndexes()));
  };

  render() {
    return (
      <section className="themes-section">
        <Grid fluid className="background-grey">
          <div className="max-container">
            <div className="title-section">
              {this.getTitle()}
            </div>
            <div className="content-section">
              {this.props.children}
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Section;