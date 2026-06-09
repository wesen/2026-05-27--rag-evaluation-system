import { buttonWidget } from '../components/atoms/Button/Button.widget';
import { captionWidget } from '../components/foundation/Caption/Caption.widget';
import { codeTextWidget } from '../components/foundation/CodeText/CodeText.widget';
import { dividerWidget } from '../components/foundation/Divider/Divider.widget';
import { statusTextWidget } from '../components/foundation/StatusText/StatusText.widget';
import { textWidget } from '../components/foundation/Text/Text.widget';
import { inlineWidget } from '../components/layout/Inline/Inline.widget';
import { panelWidget } from '../components/layout/Panel/Panel.widget';
import { stackWidget } from '../components/layout/Stack/Stack.widget';
import { dataTableWidget } from '../components/molecules/DataTable/DataTable.widget';
import { courseStudioShellWidget } from '../components/organisms/CourseStudioShell/CourseStudioShell.widget';
import { createWidgetRegistry, mergeWidgetRegistries } from './registry';

export const uiWidgetRegistry = createWidgetRegistry([
  buttonWidget,
  captionWidget,
  codeTextWidget,
  dividerWidget,
  inlineWidget,
  panelWidget,
  stackWidget,
  statusTextWidget,
  textWidget,
]);

export const dataWidgetRegistry = createWidgetRegistry([
  dataTableWidget,
]);

export const courseWidgetRegistry = createWidgetRegistry([
  courseStudioShellWidget,
]);

export const defaultWidgetRegistry = mergeWidgetRegistries(
  uiWidgetRegistry,
  dataWidgetRegistry,
  courseWidgetRegistry,
);
