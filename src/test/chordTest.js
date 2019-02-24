
class ChordTest {

    // Create an SVG renderer and attach it to the DIV element named "boo".
    static createContext() {
        var div = document.getElementById("boo");
        $(div).html('');

        var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(450, 200);
        var context = renderer.getContext();
        context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
        return context;
    }

    static CommonTests() {
        var context = ChordTest.createContext();
        var measure = new VxMeasure(context);

        var timeTest = () => {
            const promise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    },
                        200);
                });
            return promise;
        }

        var drawDefaults = () => {
            // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
            // measure.applyModifiers();
            measure.render();
            return timeTest();
        }
        var accidentalTest = () => {
			var pitches=[0];
			
			var target = measure.smoMeasure.getSelection(0,1,pitches);
            target.note.transpose(pitches,-1);
			measure.applyModifiers();
            measure.render();
            return timeTest();
        }

        var intervalTest = () => {
			var target = measure.smoMeasure.getSelection(0,2,[1]);
			if (target) {
				target.note.transpose([1],4);
			}
            measure.render();
            return timeTest();
        }
		
		var durationTest = () => {
			var tickmap = measure.tickmap();
			var actor = new SmoContractNoteActor({
                startIndex: 2,
                tickmap: tickmap,
				newTicks:2048
            });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }
		
		var durationTest2 = () => {
			var tickmap = measure.tickmap();
			var actor = new SmoStretchNoteActor({
				 startIndex: 2,
                tickmap: tickmap,
				newTicks:4096
			});
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }
		
		var rerenderTest = () => {
			measure.render();
			return timeTest();
		}
		var setPitchTest = () => {
			var target = measure.smoMeasure.getSelection(0,2,[0]);
			if (target) {
				target.note.keys=[{key:'e',octave:4,accidental:'b'},
				{key:'g',octave:5,accidental:''}];
			}
			measure.applyModifiers();
            measure.render();
            return timeTest();
        }
		
		var makeTupletTest = () => {
			var tickmap = measure.tickmap();
			var actor = new SmoMakeTupletActor({
				index:1,
				totalTicks:4096,
				numNotes:3,
				measure:measure.smoMeasure
			});
			  measure.applyTransform(actor);
            measure.render();
			console.log('tuplet serialize');
			console.log(JSON.stringify(measure.smoMeasure,null,' '));
            return timeTest();
		}
		
		var unmakeTupletTest = () => {
			var actor = new SmoUnmakeTupletActor({
				startIndex:1,
				endIndex:3,
				measure:measure.smoMeasure
			});
			  measure.applyTransform(actor);
            measure.render();
            return timeTest();
		}
		
		var courtesyTest = () => {
			var target = measure.smoMeasure.getSelection(0,2,[1]);
			target.note.addAccidental({index:1,value:{symbol:'n',cautionary:true}});
			measure.applyModifiers();			
			measure.render();
			return timeTest();
		}
		
        drawDefaults().then(accidentalTest).then(intervalTest).then(durationTest)
		.then(durationTest2).then(rerenderTest).then(setPitchTest).then(makeTupletTest)
		.then(unmakeTupletTest).then(courtesyTest);
    }
}
