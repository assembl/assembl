import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { gql, withApollo } from 'react-apollo';
import { Button, FormGroup, FormControl } from 'react-bootstrap';

import ImageUploader from '../../common/imageUploader';

export const updateTitle = (client, id, selectedLocale, titleEntryIndex, value) => {
  let entryIndex = titleEntryIndex;
  if (titleEntryIndex === -1) {
    const res = client.readFragment({
      id: `Thematic:${id}`,
      fragment: gql`
        fragment thematic on Thematic {
          titleEntries
        }
      `
    });
    entryIndex = res.titleEntries.length;
    const newTitleEntries = res.titleEntries;
    newTitleEntries.push({
      id: `Thematic:${id}.titleEntries.${entryIndex}`,
      type: 'id'
    });
    client.writeFragment({
      id: `Thematic:${id}`,
      fragment: gql`
        fragment thematic on Thematic {
          titleEntries
        }
      `,
      data: {
        titleEntries: newTitleEntries,
        __typename: 'Thematic'
      }
    });
  }
  client.writeFragment({
    id: `Thematic:${id}.titleEntries.${entryIndex}`,
    fragment: gql`
      fragment entry on LangStringEntry {
        localeCode,
        value,
        __typename
      }
    `,
    data: {
      localeCode: selectedLocale,
      value: value,
      __typename: 'LangStringEntry'
    }
  });
};

export const DumbThemeCreationForm = ({ client, id, image, index, selectedLocale, titleEntries }) => {
  const trsl = I18n.t('administration.ph.title');
  const ph = `${trsl} ${selectedLocale.toUpperCase()}`;
  const num = (Number(index) + 1).toString();
  const titleEntry = titleEntries.find((entry) => {
    return entry.localeCode === selectedLocale;
  });
  const titleEntryIndex = titleEntries.indexOf(titleEntry);
  const title = titleEntry ? titleEntry.value : '';
  const remove = () => {}; // TODO
  const updateImage = () => {}; // TODO
  const handleTitleChange = (e) => {
    return updateTitle(client, id, selectedLocale, titleEntryIndex, e.target.value);
  };
  return (
    <div className="form-container">
      <div className="title">
        <Translate value="administration.themeNum" index={num} />
      </div>
      <FormGroup>
        <FormControl type="text" placeholder={ph} value={title} onChange={handleTitleChange} />
      </FormGroup>
      <FormGroup>
        <ImageUploader
          file={image}
          handleChange={(e) => {
            return updateImage(e.target.files);
          }}
        />
      </FormGroup>
      <div className="pointer right">
        <Button onClick={remove}>
          <span className="assembl-icon-delete grey" />
        </Button>
      </div>
      <div className="separator" />
    </div>
  );
};

DumbThemeCreationForm.defaultProps = {
  title: ''
};

export default withApollo(DumbThemeCreationForm);