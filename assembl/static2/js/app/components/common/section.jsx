// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { SECTION_INDEX_GENERATOR } from '../../utils/section';

type SectionProps = {
  title: string,
  index: number,
  displayIndex: boolean,
  indexGenerator: Function,
  parents: Array<number>,
  children: Array<*>,
  className: string,
  translate: boolean
};

const level1 = (title, index, translate) => (
  <div>
    <div className="title-hyphen">&nbsp;</div>
    <h1 className="section-title section-title1 dark-title-1">
      {index ? <span className="section-title-index">{index}</span> : null}
      {translate ? <Translate value={title} /> : title}
    </h1>
  </div>
);

const level2 = (title, index, translate) => (
  <h2 className="section-title section-title-2 dark-title-1">
    {index ? <span className="section-title-index">{index}</span> : null}
    {translate ? <Translate value={title} /> : title}
  </h2>
);

const level3 = (title, index, translate) => (
  <h3 className="section-title section-title-3 dark-title-1">
    {index ? <span className="section-title-index">{index}</span> : null}
    {translate ? <Translate value={title} /> : title}
  </h3>
);

const levelN = (title, index, translate) => (
  <h3 className="section-title section-title-3 dark-title-1">
    {index ? <span className="section-title-index">{index}</span> : null}
    {translate ? <Translate value={title} /> : title}
  </h3>
);

const LEVELS = [level1, level2, level3];

class Section extends React.Component<Object, SectionProps, void> {
  props: SectionProps;

  static defaultProps = {
    index: 1,
    displayIndex: false,
    indexGenerator: SECTION_INDEX_GENERATOR.alphanumericOr,
    parents: [],
    className: 'themes-section',
    translate: false
  };

  getIndexes = () => {
    const { index, parents } = this.props;
    const indexes = parents.slice();
    indexes.push(index);
    return indexes;
  };

  getTitle = () => {
    const { title, parents, indexGenerator, displayIndex, translate } = this.props;
    const titleRenderer = LEVELS[parents.length] || levelN;
    return titleRenderer(title, displayIndex && indexGenerator(this.getIndexes()), translate);
  };

  render() {
    const { className, children } = this.props;
    return (
      <section className={className}>
        <div className="max-container">
          <div className="title-section">{this.getTitle()}</div>
          <div className="content-section">{children}</div>
        </div>
      </section>
    );
  }
}

export default Section;