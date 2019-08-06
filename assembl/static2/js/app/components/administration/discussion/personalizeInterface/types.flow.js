// @flow
import type { FileValue } from '../../../form/types.flow';

export type PersonalizeInterfaceValues = {
  title: ?string,
  favicon: FileValue,
  logo: FileValue,
  firstColor: string,
  secondColor: string
};