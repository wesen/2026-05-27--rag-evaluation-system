import { buttonWidget } from '../components/atoms/Button/Button.widget';
import { selectInputWidget } from '../components/atoms/SelectInput/SelectInput.widget';
import { textInputWidget } from '../components/atoms/TextInput/TextInput.widget';
import { captionWidget } from '../components/foundation/Caption/Caption.widget';
import { codeTextWidget } from '../components/foundation/CodeText/CodeText.widget';
import { dividerWidget } from '../components/foundation/Divider/Divider.widget';
import { statusTextWidget } from '../components/foundation/StatusText/StatusText.widget';
import { textWidget } from '../components/foundation/Text/Text.widget';
import { dashboardGridWidget } from '../components/layout/DashboardGrid/DashboardGrid.widget';
import { formRowWidget } from '../components/layout/FormRow/FormRow.widget';
import { inlineWidget } from '../components/layout/Inline/Inline.widget';
import { panelWidget } from '../components/layout/Panel/Panel.widget';
import { scrollRegionWidget } from '../components/layout/ScrollRegion/ScrollRegion.widget';
import { sectionBlockWidget } from '../components/layout/SectionBlock/SectionBlock.widget';
import { splitPaneWidget } from '../components/layout/SplitPane/SplitPane.widget';
import { stackWidget } from '../components/layout/Stack/Stack.widget';
import { tabListWidget } from '../components/layout/TabList/TabList.widget';
import { dataTableWidget } from '../components/molecules/DataTable/DataTable.widget';
import { courseStudioShellWidget } from '../components/organisms/CourseStudioShell/CourseStudioShell.widget';
import { createWidgetRegistry, mergeWidgetRegistries } from './registry';

export const uiWidgetRegistry = createWidgetRegistry([
  buttonWidget,
  captionWidget,
  codeTextWidget,
  dashboardGridWidget,
  dividerWidget,
  formRowWidget,
  inlineWidget,
  panelWidget,
  scrollRegionWidget,
  sectionBlockWidget,
  selectInputWidget,
  splitPaneWidget,
  stackWidget,
  statusTextWidget,
  tabListWidget,
  textInputWidget,
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
