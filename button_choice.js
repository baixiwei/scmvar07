// button_choice:
// present a question and wait for participant to click one of two buttons
( function ( $ ) {

    jsPsych.button_choice = (function() {
    
        var plugin = {};
        
        plugin.create = function( params ) {
            var trials = new Array( params.specs.length );
            for ( var i=0; i<trials.length; i++ ) {
                trials[i] = {};
                trials[i]["type"]           = "button_choice";
                trials[i]["mode"]           = params.mode;
                trials[i]["verbose"]        = params.verbose;
                trials[i]["ITI"]            = params.ITI;
                trials[i]["text"]           = params.specs[i]["text"];
                trials[i]["answers"]        = params.specs[i]["answers"];
                trials[i]["key"]            = params.specs[i]["key"];
                trials[i]["data"]           = params.specs[i]["data"];
            }
            return trials;
        }

        plugin.trial = function( $this, block, trial, part ) {

            // display trial content to target div
            var content = trial.text;
            for ( var i=0; i<trial.answers.length; i++ ) {
                content += "<button id='button_" + i + "' type='button' class='button_choice_button'>" + trial.answers[i] + "</button>";
                if ( i<trial.answers.length-1 ) { content += "<br><br>"; }
            }
            $this.html( content );
            window.scrollTo(0,0);
            
            // record start time
            var startTime   = (new Date()).getTime();

            // set answer buttons to react appropriately when clicked
            for ( var i=0; i<trial.answers.length; i++ ) {
                $('#button_'+i).click( function() {
                    var response    = Number( $(this).attr('id').slice(7) );
                    var accuracy    = Number( trial.key==response );
                    var rt          = (new Date()).getTime()-startTime;
                    var trial_data  = { "response": response, "accuracy": accuracy, "rt": rt };
                    block.data[block.trial_idx] = $.extend({},trial.data,trial_data);
                    if ( verbose ) { console.log( "jsPsych button_choice response received: " + response + "; accuracy: " + accuracy ); }
                    $this.html('');
                    setTimeout( function() { block.next(); }, trial.ITI );
                    } );
            }

            // TBD: click automatically if in auto mode
            // if ( trial.mode=="auto" ) { $('#submit_button').click() }
		}
        
		return plugin;
	})();
}) (jQuery);

