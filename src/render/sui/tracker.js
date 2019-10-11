
class TrackerBase {
}

// ## suiTracker
// A tracker maps the UI elements to the logical elements ,and allows the user to
// move through the score and make selections, for navigation and editing.
//
// ### Usage:
// `` javascript ``
// `new suiTracker(layout)`
//
// ### See also:
// `SuiSimpleLayout`, `controller`, `menu`
// ### class methods:
// ---
class suiTracker {
	constructor(layout) {
		this.layout = layout;
		this.groupObjectMap = {};
		this.objectGroupMap = {};
		this.objects = [];
		this.selections = [];
		this.modifierTabs = {};
		this.modifierIndex = -1;
		this.modifierSuggestion=-1;
		this.suggestion = {};
		this.pitchIndex = -1;
		this.pasteBuffer = new PasteBuffer();
	}

	// ### renderElement
	// the element the score is rendered on
	get renderElement() {
		return this.layout.renderElement;
	}

	get score() {
		return this.layout.score;
	}

	get context() {
		return this.layout.context;
	}

	_copySelections() {
		var rv = [];
		this.selections.forEach((sel) => {
			rv.push(sel.selector)
		});
		return rv;
	}

	_updateModifiers() {
		this.modifierTabs = [];
		this.modifierBoxes = [];
		var modMap = {};
		var ix=0;
		this.objects.forEach((selection) => {
			selection.staff.modifiers.forEach((modifier) => {
				if (SmoSelector.contains(selection.selector, modifier.startSelector, modifier.endSelector)) {
					if (!modMap[modifier.id]) {
						this.modifierTabs.push({
							modifier: modifier,
							selection: selection,
							box:modifier.renderedBox,
							index:ix
						});
						ix += 1;
						modMap[modifier.id] = {
							exists: true
						};
					}
				}
			});
			selection.measure.modifiers.forEach((modifier) => {
				if (modifier.id && !modMap[modifier.id]) {
					this.modifierTabs.push({
						modifier: modifier,
						selection: selection,
						box:modifier.renderedBox,
						index:ix
					});
					ix += 1;
					modMap[modifier.id] = {
						exists: true
					};
				}
			});
			selection.note.textModifiers.forEach((modifier) => {
				if (!modMap[modifier.id]) {
					this.modifierTabs.push({
						modifier: modifier,
						selection: selection,
						box:modifier.renderedBox,
						index:ix
					});
					ix += 1;
					modMap[modifier.id] = {
						exists: true
					};
				}
			});
		});
		
		this.modifierTabs.forEach((mod) => {
			
		});
	}

	_highlightModifier() {
		if (this.modifierIndex >= 0 && this.modifierIndex < this.modifierTabs.length) {
			var modSelection = this.modifierTabs[this.modifierIndex];
			if (modSelection.modifier.renderedBox) {
				this._drawRect(modSelection.modifier.renderedBox, 'staffModifier');
			}
		}
	}

	clearModifierSelections() {
		this.modifierTabs = [];
		this.modifierIndex = -1;
		this.eraseRect('staffModifier');
		this.pasteBuffer.clearSelections();
	}
	getSelectedModifier() {
		if (this.modifierIndex >= 0) {
			return this.modifierTabs[this.modifierIndex];
		}
	}

	advanceModifierSelection() {
		this.eraseRect('staffModifier');

		if (!this.modifierTabs.length) {
			return;
		}
		this.modifierIndex = this.modifierIndex + 1;
		if (this.modifierIndex >= this.modifierTabs.length) {
			this.modifierIndex = -1;
			return;
		}
		this._highlightModifier();
	}

	_findClosestSelection(selector) {
		var artifact = this._getClosestTick(selector);
		if (!artifact)
			return;
		if (this.selections.find((sel) => JSON.stringify(sel.selector)
				 === JSON.stringify(artifact.selector))) {
			return;
		}
		if (selector.pitches && selector.pitches.length && selector.pitches.length <= artifact.note.pitches.length) {
			// If the old selection had only a single pitch, try to recreate that.
			artifact.selector.pitches = JSON.parse(JSON.stringify(selector.pitches));
		}
		this.selections.push(artifact);
	}
	
	// ### updateMap
	// This should be called after rendering the score.  It updates the score to
	// graphics map and selects the first object.
	//
	// ### TODO:
	// try to preserve the previous selection
	_updateMap() {
		var notes = [].slice.call(this.renderElement.getElementsByClassName('vf-stavenote'));
		this.groupObjectMap = {};
		this.objectGroupMap = {};
		this.objects = [];
		var selCopy = this._copySelections();
		notes.forEach((note) => {
			var box = note.getBoundingClientRect();
			// box = svgHelpers.untransformSvgBox(this.context.svg,box);
			var selection = SmoSelection.renderedNoteSelection(this.score, note, box);
			if (selection) {
				this.objects.push(selection);
			}
		});
		this._updateModifiers();
		this.selections = [];
		if (this.objects.length && !selCopy.length) {
			console.log('adding selection ' + this.objects[0].note.id);
			this.selections = [this.objects[0]];
		} else {
			selCopy.forEach((sel) => this._findClosestSelection(sel));
		}
		this.highlightSelection();
		this.triggerSelection();
		this.pasteBuffer.clearSelections();
		this.pasteBuffer.setSelections(this.score, this.selections);
	}
	
	updateMap() {
		const promise = new Promise((resolve, reject) => {
             this._updateMap();
			 resolve();
                });
            return promise;
	}

	static stringifyBox(box) {
		return '{x:' + box.x + ',y:' + box.y + ',width:' + box.width + ',height:' + box.height + '}';
	}

	// ### _mapNoteElementToNote
	// given a svg note group, find the smo element that defines this note;
	_mapNoteElementToNote(nel) {
		var id = nel.getAttribute('id');
		var artifact = SmoSelection.renderedNoteSelection(this.score, nel);
		if (!artifact) {
			console.log('note ' + id + ' not found');
		} else {
			//console.log('note '+JSON.stringify(artifact.smoMeasure.measureNumber,null,' ')+' box: '+
			// suiTracker.stringifyBox(box));
			this.groupObjectMap[id] = artifact;
			this.objectGroupMap[artifact.note.id] = artifact;
			this.objects.push({
				artifact: artifact
			});
		}
	}

	_getClosestTick(selector) {
		var measureObj = this.objects.find((e) => SmoSelector.sameMeasure(e.selector, selector)
				 && e.selector.tick === 0);
		var tickObj = this.objects.find((e) => SmoSelector.sameNote(e.selector, selector));
		var firstObj = this.objects[0];
		return (tickObj) ? tickObj: 
		    (measureObj ? measureObj : firstObj);
	}

	// ### getExtremeSelection
	// Get the rightmost (1) or leftmost (-1) selection
	getExtremeSelection(sign) {
		var rv = this.selections[0];
		for (var i = 1; i < this.selections.length; ++i) {
			var sa = this.selections[i].selector;
			if (sa.measure * sign > rv.selector.measure * sign) {
				rv = this.selections[i];
			} else if (sa.measure === rv.selector.measure && sa.tick * sign > rv.selector.tick * sign) {
				rv = this.selections[i];
			}
		}
		return rv;
	}

	// ### _getOffsetSelection
	// Get the selector that is the offset of the first existing selection
	_getOffsetSelection(offset) {
		var increment = offset;
		var testSelection = this.getExtremeSelection(Math.sign(offset));
		var scopyTick = JSON.parse(JSON.stringify(testSelection.selector));
		var scopyMeasure = JSON.parse(JSON.stringify(testSelection.selector));
		scopyTick.tick += increment;
		scopyMeasure.measure += increment;
		var targetMeasure = SmoSelection.measureSelection(this.score, testSelection.selector.staff,
				scopyMeasure.measure);
		if (targetMeasure && targetMeasure.measure) {
			scopyMeasure.tick = (offset < 0) ? targetMeasure.measure.notes.length - 1 : 0;
		}

		if (testSelection.measure.notes.length > scopyTick.tick && scopyTick.tick >= 0) {
			return scopyTick;
		} else if (targetMeasure &&
			scopyMeasure.measure < testSelection.staff.measures.length && scopyMeasure.measure >= 0) {
			return scopyMeasure;
		}
		return testSelection.selector;
	}

	static unionRect(b1, b2) {
		return svgHelpers.unionRect(b1, b2);
	}

	get selectedArtifact() {
		for (var i = 0; i < this.selections.length; ++i) {
			var selection = this.selections[i];
			if (selection['artifact']) {
				return selection.artifact;
			}
		}
		return {};
	}

	growSelectionRight() {
		var nselect = this._getOffsetSelection(1);
		// already selected
		var artifact = this._getClosestTick(nselect);
		if (!artifact) {
			return;
		}
		if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
			return;
		}
		console.log('adding selection ' + artifact.note.id);

		this.selections.push(artifact);
		this.highlightSelection();
		this.triggerSelection();
	}

	growSelectionLeft() {
		var nselect = this._getOffsetSelection(-1);
		// already selected
		var artifact = this._getClosestTick(nselect);
		if (!artifact) {
			return;
		}
		if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
			return;
		}

		console.log('adding selection ' + artifact.note.id);
		this.selections.push(artifact);
		this.highlightSelection();
		this.triggerSelection();
	}

	moveSelectionRight() {
		if (this.selections.length == 0) {
			return;
		}
		var nselect = this._getOffsetSelection(1);
		this._replaceSelection(nselect);
	}

	moveSelectionLeft() {
		if (this.selections.length == 0) {
			return;
		}
		var nselect = this._getOffsetSelection(-1);
		this._replaceSelection(nselect);
	}
	moveSelectionLeftMeasure() {
		this._moveSelectionMeasure(-1);
	}
	moveSelectionRightMeasure() {
		this._moveSelectionMeasure(1);
	}
	moveSelectionOffset(offset) {
		var fcn = (offset >= 0 ? 'moveSelectionRight' : 'moveSelectionLeft');
		offset = (offset < 0) ? -1 * offset : offset;
		for (var i = 0; i < offset; ++i) {
			this[fcn]();
		}
	}

	_moveSelectionMeasure(offset) {
		var selection = this.getExtremeSelection(Math.sign(offset));
		selection = JSON.parse(JSON.stringify(selection.selector));
		selection.measure += offset;
		selection.tick = 0;
		var selObj = this._getClosestTick(selection);
		if (selObj) {
			this.selections = [selObj];
		}
		this.highlightSelection();
		this.triggerSelection();
	}

	_moveStaffOffset(offset) {
		if (this.selections.length == 0) {
			return;
		}

		var nselector = JSON.parse(JSON.stringify(this.selections[0].selector));
		nselector.staff = this.score.incrementActiveStaff(offset);
		this.selections = [this._getClosestTick(nselector)];
		this.highlightSelection();
		this.triggerSelection();
	}

	// ### _moveSelectionPitch
	// Suggest a specific pitch in a chord, so we can transpose just the one note vs. the whole chord.
	_moveSelectionPitch(index) {
		if (!this.selections.length) {
			return;
		}
		var sel = this.selections[0];
		var note = sel.note;
		if (note.pitches.length < 2) {
			this.pitchIndex = -1;
			return;
		}
		this.pitchIndex = (this.pitchIndex + index) % note.pitches.length;
		sel.selector.pitches = [];
		sel.selector.pitches.push(this.pitchIndex);
		this._highlightPitchSelection(note, this.pitchIndex);
	}
	moveSelectionPitchUp() {
		this._moveSelectionPitch(1);
	}
	moveSelectionPitchDown() {
		if (!this.selections.length) {
			return;
		}
		this._moveSelectionPitch(this.selections[0].note.pitches.length - 1);
	}

	moveSelectionUp() {
		this._moveStaffOffset(-1);
	}
	moveSelectionDown() {
		this._moveStaffOffset(1);
	}

	containsArtifact() {
		return this.selections.length > 0;
	}

	_replaceSelection(nselector) {
		var artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, nselector.voice, nselector.tick);
		this.score.setActiveStaff(nselector.staff);
		var mapped = this.objects.find((el) => {
				return SmoSelector.sameNote(el.selector, artifact.selector);
			});
		if (!mapped) {
			return;
		}
		// If this is a new selection, remove pitch-specific and replace with note-specific
		if (!nselector['pitches'] || nselector.pitches.length==0) {
			this.pitchIndex = -1;
		}
		console.log('adding selection ' + mapped.note.id);

		this.selections = [mapped];
		this.highlightSelection();
		this.triggerSelection();
	}

	getFirstMeasureOfSelection() {
		if (this.selections.length) {
			return this.selections[0].measure;
		}
		return null;
	}
	// ## measureIterator
	// Description: iterate over the any measures that are part of the selection
	iterateMeasures(callback) {
		var set = [];
		this.selections.forEach((sel) => {
			var measure = SmoSelection.measureSelection(this.score, sel.selector.staff, sel.selector.measure).measure;
			var ix = measure.measureNumber.measureIndex;
			if (set.indexOf(ix) === -1) {
				set.push(ix);
				callback(measure);
			}
		});
	}
	
	_selectFromToInStaff(sel1,sel2) {
		this.selections=[];
		this.objects.forEach((obj) => {
			if (SmoSelector.gteq(obj.selector,sel1.selector) && SmoSelector.lteq(obj.selector,sel2.selector)) {
				this.selections.push(obj);
			}
		});
	}
	_addSelection(selection) {
		var ar=this.selections.filter((sel) => {
			return SmoSelector.neq(sel.selector,selection.selector);
		});
		ar.push(selection);
		this.selections=ar;
	}
	
	selectSuggestion(ev) {
		if (!this.suggestion['measure']) {
			return;
		}
		console.log('adding selection ' + this.suggestion.note.id);
		
		if (this.modifierSuggestion >= 0) {
			if (this['suggestFadeTimer']) {
			   clearTimeout(this.suggestFadeTimer);
    		}	
			this.modifierIndex = this.modifierSuggestion;
			this.modifierSuggestion = -1;
			console.log('ms -1');
			this._highlightModifier();
			$('body').trigger('tracker-select-modifier');
			return;
		}
		if (ev.shiftKey) {
			var sel1 = this.getExtremeSelection(-1);
			if (sel1.selector.staff === this.suggestion.selector.staff) {
				var min = SmoSelector.gt(sel1.selector,this.suggestion.selector)  ? this.suggestion : sel1;
				var max = SmoSelector.lt(min.selector,this.suggestion.selector) ? this.suggestion : sel1;
				this._selectFromToInStaff(min,max);
				this.highlightSelection();
				return;
			}
		}
		
		if (ev.ctrlKey) {
			this._addSelection(this.suggestion);
			this.highlightSelection();
			return;
		}

		this.selections = [this.suggestion];
		this.score.setActiveStaff(this.selections[0].selector.staff);
		if (this.selections.length == 0)
			return;
		var first = this.selections[0];
		for (var i = 0; i < this.selections.length; ++i) {
			var selection = this.selections[i];
			this.highlightSelection();
		}
		this.triggerSelection();
	}

	static get strokes() {
		return {
			'suggestion': {
				'stroke': '#fc9',
				'stroke-width': 2,
				'stroke-dasharray': '4,1',
				'fill': 'none'
			},
			'selection': {
				'stroke': '#99d',
				'stroke-width': 2,
				'fill': 'none'
			},
			'staffModifier': {
				'stroke': '#933',
				'stroke-width': 2,
				'fill': 'none'
			}
		}
	}
	
	_setFadeTimer() {
		if (this['suggestFadeTimer']) {
			clearTimeout(this.suggestFadeTimer);
		}
		var tracker=this;
		this.suggestFadeTimer = setTimeout(function () {
				if (tracker.containsArtifact()) {
					tracker.eraseRect('suggestion');
					console.log('ms -1');
					tracker.modifierSuggestion=-1;
				}
			}, 1000);
	}
	

    _setModifierAsSuggestion(bb,artifact) {
		
		this.modifierSuggestion = artifact.index;
		console.log('ms '+ artifact.index);

		this._drawRect(artifact.box, 'suggestion');
		this._setFadeTimer();
	}
	_setArtifactAsSuggestion(bb, artifact) {
		var self = this;

		var sameSel =
			this.selections.find((ss) => SmoSelector.sameNote(ss.selector, artifact.selector));

		if (sameSel) {
			return ;
		}
		
		this.modifierSuggestion = -1;
		console.log('ms -1');

		this.suggestion = artifact;
		this._drawRect(artifact.box, 'suggestion');
		this._setFadeTimer();
	}

	intersectingArtifact(bb) {
		var artifacts = svgHelpers.findIntersectingArtifact(bb,this.objects);
		// TODO: handle overlapping suggestions
		if (!artifacts.length) {
			var sel = svgHelpers.findIntersectingArtifact(bb,this.modifierTabs);
			if (sel.length) {
				sel = sel[0];
				this._setModifierAsSuggestion(bb, sel);
			}
			return;
		}
		var artifact = artifacts[0];
		this._setArtifactAsSuggestion(bb, artifact);
		return;
	}

	eraseAllSelections() {
		var strokeKeys = Object.keys(suiTracker.strokes);
		strokeKeys.forEach((key) => {
			this.eraseRect(key);
		});
	}

	eraseRect(stroke) {
		$(this.renderElement).find('g.vf-' + stroke).remove();
	}

	_highlightPitchSelection(note, index) {
		this.eraseAllSelections();
		var noteDiv = $(this.renderElement).find('#' + note.renderId);
		var heads = noteDiv.find('.vf-notehead');
		if (!heads.length) {
			return;
		}
		var headEl = heads[index];
		var box = headEl.getBoundingClientRect();
		this._drawRect(box, 'staffModifier');
	}
	triggerSelection() {
		$('body').trigger('tracker-selection');
	}

	highlightSelection() {
		if (this.pitchIndex >= 0 && this.selections.length == 1 &&
			this.pitchIndex < this.selections[0].note.pitches.length) {
			this._highlightPitchSelection(this.selections[0].note, this.pitchIndex);
			return;
		}
		this.pitchIndex = -1;
		this.eraseAllSelections();
		if (this.selections.length === 1) {
			this._drawRect(this.selections[0].box, 'selection');			
			return;
		}
		var sorted = this.selections.sort((a, b) => a.box.y - b.box.y);
		var prevSel = sorted[0];
		var curBox = svgHelpers.smoBox(prevSel.box);
		var boxes = [];
		for (var i = 1; i < sorted.length; ++i) {
			var sel = sorted[i];
			var ydiff = Math.abs(prevSel.box.y - sel.box.y);
			if (sel.selector.staff === prevSel.selector.staff && ydiff < 1.0) {
				curBox = svgHelpers.unionRect(curBox, sel.box);
			} else {
				boxes.push(curBox);
				curBox = sel.box;
			}
			prevSel = sel;
		}
		boxes.push(curBox);
		this._drawRect(boxes, 'selection');
	}
	_outerSelection() {
		if (this.selections.length == 0)
			return null;
		var rv = this.selections[0].box;
		for (var i = 1; i < this.selections.length; ++i) {
			rv = suiTracker.unionRect(rv, this.selections[i].box);
		}
		return rv;
	}
	_drawRect(bb, stroke) {
		this.eraseRect(stroke);
		var grp = this.context.openGroup(stroke, stroke + '-');
		if (!Array.isArray(bb)) {
			bb = [bb];
		}
		bb.forEach((box) => {
			var strokes = suiTracker.strokes[stroke];
			var strokeObj = {};
			var margin = 5;
			$(Object.keys(strokes)).each(function (ix, key) {
				strokeObj[key] = strokes[key];
			});
			box = svgHelpers.clientToLogical(this.context.svg, box);
			this.context.rect(box.x - margin, box.y - margin, box.width + margin * 2, box.height + margin * 2, strokeObj);
		});
		this.context.closeGroup(grp);
	}
}
