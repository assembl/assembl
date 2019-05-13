// @flow
import type { FileValue, I18nRichTextValue, I18nValue } from '../../form/types.flow';
import { PublicationStates } from '../../../constants';

export type SynthesisFormValues = {
  subject: I18nValue,
  body: I18nRichTextValue,
  image: FileValue,
};

export type MultilingualSynthesisPost = {
  // The ID of the object.
  id: string,
  publicationState: string,
  // Graphene Field modeling a relationship to a published synthesisPost.
  publishesSynthesis: {|
    // The ID of the object.
    id: string,
    // The type of Synthesis to be created
    synthesisType: SynthesisTypes,
    // A list of possible languages of the entity as LangStringEntry objects. The subject in various languages.
    subjectEntries: LangstringEntries,
    // A list of possible languages of the entity as LangStringEntry objects. The body in various languages.
    bodyEntries: LangstringEntries,
    // This is a header image document object that will be visible on the Synthesis view's header.A file metadata object, described by the Document object.
    img: FileValue
  |}
}
