// Smoosic relies on dynamic creation of almost everything.  This class exports all the symbols 
// that need to be created via reflection.
// ui application components
import { SuiApplication } from './application';
import { suiController } from './controller';
import {
    RibbonButtons, DisplaySettings, NoteButtons, TextButtons,
    ChordButtons, MicrotoneButtons, StaveButtons, BeamButtons, MeasureButtons,
    DebugButtons, DurationButtons, VoiceButtons, PlayerButtons,
    ArticulationButtons, NavigationButtons, ExtendedCollapseParent
} from './ribbon';
import { SuiExceptionHandler } from './exceptions';
import { Qwerty } from './qwerty';
import { suiPiano } from '../render/sui/piano';
import { SuiDom } from './dom';
import { basicJson, emptyScoreJson } from '../music/basic';
import { SuiHelp } from './help';

// Language strings
import { quickStartHtmlen, selectionHtmlen, enterDurationsHtmlen, enterPitchesHtmlen } from './i18n/language_en';
import { quickStartHtmlar, selectionHtmlar, enterDurationsHtmlar, enterPitchesHtmlar } from './i18n/language_en';

// ui dialogs and menus
// Dialogs
import { SuiModifierDialogFactory } from './dialog';
import { SuiTempoDialog, SuiInstrumentDialog, SuiMeasureDialog, SuiInsertMeasures,
    SuiTimeSignatureDialog } from './dialogs/measureDialogs';
import { SuiScoreViewDialog, SuiGlobalLayoutDialog, SuiScoreIdentificationDialog, 
    SuiScoreFontDialog, SuiLayoutDialog,  } from './dialogs/scoreDialogs';    
import { SuiLibraryDialog } from './dialogs/libraryDialog';
import { SuiDynamicModifierDialog, SuiTextTransformDialog, SuiLyricDialog, SuiChordChangeDialog,
  helpModal } from './dialogs/textDialogs';
import { SuiStaffModifierDialog, SuiSlurAttributesDialog, SuiTieAttributesDialog, SuiVoltaAttributeDialog,
    SuiHairpinAttributesDialog, SuiStaffGroupDialog } from './dialogs/staffDialogs';
import { SuiFileDialog,  SuiLoadFileDialog, SuiLoadMxmlDialog, 
    SuiLoadActionsDialog, SuiPrintFileDialog, SuiSaveFileDialog, SuiSaveXmlDialog,
    SuiSaveMidiDialog, SuiSaveActionsDialog } from './dialogs/fileDialogs';
    // Dialog components
import {
    SuiDropdownComponent, SuiRockerComponent, SuiFileDownloadComponent,
    SuiToggleComponent, SuiButtonComponent, SuiDropdownComposite,
    SuiToggleComposite, SuiButtonComposite, SuiRockerComposite, SuiTextInputComposite,
    SuiTextInputComponent
} from './dialogComponents';
import { SuiFontComponent, SuiTextBlockComponent } from './dialogs/fontComponent';
import { SuiTreeComponent } from './dialogs/treeComponent';
import {
    SuiTextInPlace, SuiLyricComponent, SuiChordComponent, SuiDragText,
    SuiNoteTextComponent
} from './dialogs/textComponents';
import { CheckboxDropdownComponent, TieMappingComponent, StaffAddRemoveComponent,
    StaffCheckComponent, TextCheckComponent} from './dialogs/staffComponents';
// menus
import {
    suiMenuManager, SuiScoreMenu, SuiFileMenu, SuiLibraryMenu,
    SuiDynamicsMenu, SuiTimeSignatureMenu, SuiKeySignatureMenu, SuiStaffModifierMenu,
    SuiLanguageMenu, SuiMeasureMenu, SuiAddStaffMenu
} from './menus';

// render library
import { SuiScoreView } from '../render/sui/scoreView';
import { layoutDebug } from '../render/sui/layoutDebug';

// SMO components
import { UndoBuffer } from '../smo/xform/undo';
import { SmoNote } from '../smo/data/note';
import { SmoDuration } from '../smo/xform/tickDuration';
import { SmoStaffHairpin, StaffModifierBase, SmoInstrument, SmoPartMap, SmoSlur, SmoTie } from '../smo/data/staffModifiers';
import { SmoMeasure } from '../smo/data/measure';
import { SmoSelection } from '../smo/xform/selections';
import { SmoOrnament, SmoArticulation, SmoDynamicText, SmoGraceNote, SmoMicrotone, SmoLyric } from '../smo/data/noteModifiers';
import { SmoSystemStaff } from '../smo/data/systemStaff';
import { SmoSystemGroup } from '../smo/data/scoreModifiers';
import {
    SmoRehearsalMark, SmoMeasureFormat, SmoBarline, SmoRepeatSymbol,
    SmoVolta, SmoMeasureText, SmoTempoText
} from '../smo/data/measureModifiers';
import { SmoMeasureFormat, SmoBarline } from '../smo/data/measureModifiers';
import { SuiFileDialog } from './dialogs/fileDialogs';

export const Smo = {
    // Application-level classes
    SuiApplication, SuiDom,  suiController, SuiExceptionHandler,
    Qwerty, SuiHelp,
    // Ribbon buttons
    RibbonButtons, NoteButtons, TextButtons, ChordButtons, MicrotoneButtons,
    StaveButtons, BeamButtons, MeasureButtons, DebugButtons, DurationButtons,
    VoiceButtons, PlayerButtons, ArticulationButtons,  NavigationButtons,
    DisplaySettings,  ExtendedCollapseParent,
    // Menus
    suiMenuManager, SuiScoreMenu, SuiFileMenu, SuiLibraryMenu,
    SuiDynamicsMenu, SuiTimeSignatureMenu, SuiKeySignatureMenu, SuiStaffModifierMenu,
    SuiLanguageMenu, SuiMeasureMenu, SuiAddStaffMenu,
    // Dialogs
    SuiTempoDialog, SuiInstrumentDialog, SuiModifierDialogFactory, SuiLibraryDialog,
    SuiScoreViewDialog, SuiGlobalLayoutDialog, SuiScoreIdentificationDialog, 
    SuiScoreFontDialog, SuiLayoutDialog, SuiMeasureDialog, SuiInsertMeasures,
    SuiTimeSignatureDialog,SuiTextTransformDialog, SuiLyricDialog, SuiChordChangeDialog,
    SuiStaffModifierDialog, SuiSlurAttributesDialog, SuiTieAttributesDialog, SuiVoltaAttributeDialog,
    SuiHairpinAttributesDialog, SuiStaffGroupDialog, helpModal,
    SuiFileDialog,  SuiLoadFileDialog, SuiLoadMxmlDialog, 
    SuiLoadActionsDialog, SuiPrintFileDialog, SuiSaveFileDialog, SuiSaveXmlDialog,
    SuiSaveMidiDialog, SuiSaveActionsDialog,
    // Dialog components
    SuiTreeComponent,
    SuiDropdownComponent,
    SuiRockerComponent, SuiFileDownloadComponent,
    SuiToggleComponent, SuiButtonComponent, SuiDropdownComposite,
    SuiToggleComposite, SuiButtonComposite, SuiRockerComposite, SuiTextInputComposite,
    SuiFontComponent, SuiTextInPlace, SuiLyricComponent, SuiChordComponent, SuiDragText,
    SuiNoteTextComponent, SuiTextBlockComponent, SuiTextInputComponent,
    SuiDynamicModifierDialog, CheckboxDropdownComponent, TieMappingComponent, StaffAddRemoveComponent,
    StaffCheckComponent, TextCheckComponent,
    // Rendering components
    suiPiano, layoutDebug, SuiScoreView,
    // Smo Music Objects
    SmoMeasure,
    SmoSystemStaff,
    SmoNote,    
    // staff modifier
    SmoStaffHairpin, StaffModifierBase,
    SmoInstrument, SmoPartMap, SmoSlur, SmoTie, SmoSystemGroup,
    // measure modifiers
    SmoRehearsalMark, SmoMeasureFormat, SmoBarline, SmoRepeatSymbol,
    SmoVolta, SmoMeasureText, SmoTempoText,
    // note modifiers
    SmoOrnament,
    SmoArticulation, SmoDynamicText, SmoGraceNote, SmoMicrotone, SmoLyric,
    // Smo Transformers
    SmoSelection, SmoDuration, UndoBuffer,
    // new score bootstrap
    basicJson,
    emptyScoreJson,
    // strings
    quickStartHtmlen, selectionHtmlen, enterDurationsHtmlen, enterPitchesHtmlen,
    quickStartHtmlar, selectionHtmlar, enterDurationsHtmlar, enterPitchesHtmlar
}
Smo.getClass = (jsonString) => {
    return eval('Smo.' + jsonString);
};
export default Smo;
