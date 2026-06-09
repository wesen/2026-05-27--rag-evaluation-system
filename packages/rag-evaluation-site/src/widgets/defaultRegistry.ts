import { buttonWidget } from '../components/atoms/Button/Button.widget';
import { panelWidget } from '../components/layout/Panel/Panel.widget';
import { stackWidget } from '../components/layout/Stack/Stack.widget';
import { dataTableWidget } from '../components/molecules/DataTable/DataTable.widget';
import { courseStudioShellWidget } from '../components/organisms/CourseStudioShell/CourseStudioShell.widget';
import { createWidgetRegistry, mergeWidgetRegistries } from './registry';

export const uiWidgetRegistry = createWidgetRegistry([
  buttonWidget,
  panelWidget,
  stackWidget,
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
