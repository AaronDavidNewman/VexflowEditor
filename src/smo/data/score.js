
class SmoScore {
    constructor(params) {
        Vex.Merge(this, SmoScore.defaults);
        Vex.Merge(this, params);
        if (this.staves.length) {
            this._numberStaves();
        }
    }
    static get defaults() {
        return {
            staffX: 30,
            staffY: 40,
            staffWidth: 1600,
            interGap: 30,
            startIndex: 0,
            renumberingMap: {},
			keySignatureMap:{},
			measureTickmap:[],
            staves: [],
            activeStaff: 0,
			pageWidth: 8 * 96 + 48,
            pageHeight: 11 * 96,
            svgScale: 0.8,
			zoomScale:1.0
        };
    }
	
	static get defaultAttributes() {
		return ['staffX', 'staffY', 'staffWidth', 'startIndex', 'interGap', 'renumberingMap', 'renumberIndex'];
	}
	serialize() {
		var params={};
		smoMusic.filteredMerge(SmoScore.defaultAttributes,this,params);
		var obj={score:params,staves:[]};
		this.staves.forEach((staff) => {
			obj.staves.push(staff.serialize());
		});
		return obj;
	}
	static deserialize(jsonString) {
        var jsonObj = JSON.parse(jsonString);
        var params = {};
		var staves=[];
        smoMusic.filteredMerge(
            SmoScore.defaultAttributes,
            jsonObj, params);
        jsonObj.staves.forEach((staffObj) => {
            var staff = SmoSystemStaff.deserialize(staffObj);
            staves.push(staff);
        });
		params.staves=staves;

        return new SmoScore(params);
    }
	
	static getDefaultScore(scoreDefaults,measureDefaults) {
		scoreDefaults = (scoreDefaults != null ? scoreDefaults : SmoScore.defaults);
		measureDefaults = (measureDefaults != null ? measureDefaults : SmoMeasure.defaults);
		var score = new SmoScore(scoreDefaults);
		score.addInstrument(measureDefaults);
		var measure = SmoMeasure.getDefaultMeasure(measureDefaults);
		score.addMeasure(0,measure);
		measure.voices.push({notes:SmoMeasure.getDefaultNotes(measureDefaults)});
		return score;
	}
	
	static getEmptyScore(scoreDefaults) {
		var score = new SmoScore(scoreDefaults);
		score.addInstrument();
		return score;
	}
	applyBeamers() {
		for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
			stave.applyBeamers();
		}
	}

    _numberStaves() {
       for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
            stave.numberMeasures();
        }
    }
	
	getMeasureAtSelection(selection) {
		return this.staves[this.activeStaff].getMeasureAtSelection(selection);
	}
	// If we are adding a measure, find the previous measure to get constructor parameters from it.
	_getMeasureContext(staff,measureIndex) {
		var rv={};
		Vex.Merge(rv,SmoMeasure.defaults);
		
		if (measureIndex < staff.measures.length) {
			smoMusic.filteredMerge(SmoMeasure.defaultAttributes, rv, staff.measures[i]);
		}
		return rv;
	}
	
	addDefaultMeasure(measureIndex,parameters) {
		for (var i=0;i<this.staves.length;++i) {
			var staff=this.staves[i];
			// TODO: find best measure for context, with key, time signature etc.
			var defaultMeasure = 
				SmoMeasure.getDefaultMeasure(parameters);
			staff.addMeasure(measureIndex,defaultMeasure);
		}
		this._numberStaves();
	}
	
	addDefaultMeasureWithNotes(measureIndex,parameters) {
		this.staves.forEach((staff) => {
			var defaultMeasure = 
				SmoMeasure.getDefaultMeasureWithNotes(parameters);
			staff.addMeasure(measureIndex,defaultMeasure);
		});
	}
	_updateMeasureTickmap() {
		this.measureTickmap=[];
		this.measures.forEach((measure) => {
			this.measureTickmap.push(measure.tickmap());
		});
	}
	// ## addMeasure
	// ## Description:
	// Give a measure prototype, create a new measure and add it to each staff, with the 
	// correct settings for current time signature/clef.
	addMeasure(measureIndex,measure) {
		
		for (var i=0;i<this.staves.length;++i) {
			var protomeasure = measure;
			var staff=this.staves[i];
			// Since this staff may already have instrument settings, use the 
			// immediately precending or post-ceding measure if it exists.
			if (measureIndex < staff.measures.length) {
				protomeasure = staff.measures[measureIndex];
			} else if (staff.measures.length) {
				protomeasure = staff.measures[staff.measure.length-1];
			}
			var nmeasure = SmoMeasure.getDefaultMeasureWithNotes(protomeasure);
			staff.addMeasure(measureIndex,nmeasure);
		}
		this._numberStaves();
	}
	
	replaceMeasure(selector,measure) {
		var staff=this.staves[selector.staff];
		staff.measures[selector.measure]=measure;
	}
	addKeySignature(measureIndex,key) {
		this.staves.forEach((staff) => {staff.addKeySignature(measureIndex,key);});
	}
	addInstrument(parameters) {
		if (this.staves.length ==0 )  {
			this.staves.push(new SmoSystemStaff(parameters));
			this.activeStaff=0;
			return;
		}
		if (!parameters) {
			parameters=SmoSystemStaff.defaults;
		}
		var proto=this.staves[0];
		var measures=[];
		for (var i=0;i<proto.measures.length;++i) {
			var newParams = {};
			var measure=proto.measures[i];
			smoMusic.filteredMerge(SmoMeasure.defaultAttributes, measure, newParams);
			newParams.clef=parameters.instrumentInfo.clef;			
			var newMeasure=SmoMeasure.getDefaultMeasureWithNotes(newParams);
			newMeasure.measureNumber = measure.measureNumber;
			measures.push(newMeasure);
		}
		parameters.measures=measures;
		var staff = new SmoSystemStaff(parameters);
		this.staves.push(staff);
		this.activeStaff=this.staves.length-1;
	}
	
	getMaxTicksMeasure(measure) {		
		return this.staves[this.activeStaff].getMaxTicksMeasure(measure);
	}
	get measures() {
		if (this.staves.length === 0) return [];
		return this.staves[this.activeStaff].measures;
	}
	incrementActiveStaff(offset) {
		if (offset<0) offset = (-1*offset)+this.staves.length;
		var nextStaff = (this.activeStaff + offset) % this.staves.length;
		if (nextStaff >= 0 && nextStaff < this.staves.length) {
			this.activeStaff=nextStaff;
		}
		return this.activeStaff;
	}
	
  
	setActiveStaff(index) {
		this.activeStaff=index<=this.staves.length ? index : this.activeStaff;
	}
	
    getRenderedNote(id) {
        for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
            var note = stave.getRenderedNote(id);
            if (note) {
				note.selection.staffIndex=i;
                return note;
            }
        }
        return null;
    }
}
