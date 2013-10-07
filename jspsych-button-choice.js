function createProgressBar( complete, total ) {
    var width   = $('#target').width()-150;
    var height  = 20; 
    var padding = 3;
    var content = "<table><tr><td style='vertical-align:middle; width: "+100+"px'>Your progress:  </td><td>";
    content     += "<div style='background-color: gray; border-radius: "+((height/2)+padding)+"px; padding: "+padding+"px; width: "+width+"px'>";
    content     += "<div style='background-color: #00FF99; width: "+(Math.floor(100*complete/total))+"%; height: "+height+"px; border-radius: "+(height/2)+"px'>";
    // content     += "<div style='background-color: green; width: 40%; height: "+height+"px; border-radius: "+(height/2)+"px'>";
    content     += "</div></div></td></tr></table><br>";
    return content;
}

function answersToButtons( answers, id, randomize ) {
    var getArrayIdxs = function( arr ) {
        var result = new Array( arr.length );
        for ( var i=0; i<result.length; i++ ) result[i]=i;
        return result;
    }
    randomize   = ( randomize===undefined ) ? true : randomize ;
    var answersIdxs = (randomize==true) ? shuffle( getArrayIdxs( answers ) ) : getArrayIdxs( answers );
    var result  = "<table class='button-set'><tr>";
    for ( var i=0; i<answers.length; i++ ) {
        result += "<td><button type='button' class='button-choice-button' id='" + id + i.toString() + "' name='" + answersIdxs[i] + "'>" + answers[answersIdxs[i]] + "</button></td>";
        // result += "<input type='button' class='button-choice-button' id='" + id + i.toString() + "' name='" + i + "' value='" + answers[answersIdxs[i]] + "'></input>";
    }
    result += "</tr></table>";
    return result;
}

//////////////////////////////////////
// button-choice plugin for jspsych
//////////////////////////////////////

( function ( $ ) {

    jsPsych.button_choice = (function() {
    
        var plugin = {};
        
        plugin.create = function( params ) {
        
            var trials = new Array( params.specs.length );

            for ( var i=0; i<trials.length; i++ ) {
                trials[i] = {};
                trials[i]["type"]       = "button_choice";
                trials[i]["mode"]       = (params.mode==undefined) ? "forced" : params.mode;
                trials[i]["progress"]   = (params.progress==undefined) ? false : params.progress;
                trials[i]["specs"]      = params.specs[i];
                trials[i]["data"]       = params.data[i];
            }
                
            return trials;
            
        }
        
        plugin.trial = function( $this, block, trial, part ) {
            
            // record start time
            var start_time = ( new Date() ).getTime();
            
            // write page content to page
            var content = "";
            if ( trial.progress ) {
                content += createProgressBar( block.trial_idx, block.trials.length );
            }
            content     += trial.specs.text;
            content     += answersToButtons( trial.specs.answers, "button_", true );
            $this.html( content );
            
            // add submit button handlers
            var submit = function( response ) {
                var accuracy = Number( response==trial.specs.key );
                var rt       = ( new Date() ).getTime() - start_time;
                var data     = $.extend( {}, trial.data, { "response": response, "accuracy": accuracy, "rt": rt } );
                console.log( "jsPsych.button-choice response: " + response.toString() + " with key " + trial.specs.key.toString() + ". accuracy: " + accuracy.toString() );
                block.data[block.trial_idx] = data;
                $this.html('');
                setTimeout( function(){block.next();}, trial.timing );
            }
            for ( var i=0; i<trial.specs.answers.length; i++ ) {
                $('#button_'+i).click( function() { submit( Number( $( this ).attr( 'name' ) ) ); } );
            }
            
            // answer automatically if in auto mode
            if ( trial.mode=="auto" ) {
                var answer = Math.floor( Math.random() * trial.specs.answers.length );
                $('#button_'+answer).click();
            }
            
		}
        
		return plugin;
	})();
}) (jQuery);

