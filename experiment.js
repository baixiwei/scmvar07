// runExperiment:
// create an array of trial specifications, then run it on jspsych using the button_choice plugin
function runExperiment( conds_subconds, target, callback, mode, verbose ) {
    // convert conds_subconds array into array of trial parameters
    var parameters      = condsSubcondsToParameters( conds_subconds );
    // assign default values to mode and verbose, if not already assigned
    mode                = (mode==undefined) ? "forced" : mode;
    verbose             = (verbose==undefined) ? false : verbose;
    // create experiment structure object
    var exp_struct      = makeExpStruct( parameters, mode, verbose );
    // run jspsych on the created experiment structure
    if ( verbose ) { console.log( "experiment.js > runExperiment calling jsPsych.init." ); }
    jsPsych.init( target,
        { "experiment_structure": exp_struct,
          "plugins": [ { "type": "button_choice", "src": "button_choice.js" } ],
          "finish": callback } );
}

// condsSubcondsToParameters:
// convert an array of conditions & subconditions into an array of trial parameters
// (conditions & subconditions are counterbalanced, so their assignment needs DB access and so is handled outside of this script;
// other parameters are generated either based on cond/subcond or randomly within this script)
function condsSubcondsToParameters( conds_subconds ) {
    var parameters = new Array( conds_subconds.length );
    for ( var i=0; i<parameters.length; i++ ) {
        parameters[i]   = condSubcondToParameters( conds_subconds[i] );
    }
    return parameters;
}

// condSubcondToParamters:
// convert one condition/subcondition pair into a set of parameters for one trial
function condSubcondToParameters( cond_subcond ) {
    var params = {};
    params[ 'condition'      ]  = cond_subcond['condition'];
    params[ 'subcondition'   ]  = cond_subcond['subcondition'];
    // use subcondition to determine values for counterbalanced params
    params[ 'question_order' ]  = [ 0, 0, 0, 0, 1, 1, 1, 1 ][ params.subcondition ];
    params[ 'answer_order'   ]  = [ 0, 0, 1, 1, 0, 0, 1, 1 ][ params.subcondition ];
    params[ 'term_consistency' ] = [ 0, 1, 0, 1, 0, 1, 0, 1 ][ params.subcondition ];
    // randomly select values for randomized params
    params[ 'q1_term_order'  ]  = Math.floor( Math.random()*2 );
    params[ 'q2_term_order'  ]  = ( 1 + params[ 'term_consistency' ] + params[ 'q1_term_order'  ] ) % 2;
    var numbers;
    numbers = generateNumbers();
    params[ 'q1_base_num'    ]  = numbers[0];
    params[ 'q1_exp_num'     ]  = numbers[1];
    numbers = generateNumbers();
    params[ 'q2_base_num'    ]  = numbers[0];
    params[ 'q2_exp_num'     ]  = numbers[1];
    return( params );
}

// generateNumbers:
//  returns a pair of numbers in [3,9] both of which are different from each other & those returned the last time it was called
var prev_numbers = [ 0, 0 ];
function generateNumbers() {
    // randIntExclude: return an integer in [m,n] but not in l
    function randIntExclude(m,n,l) {
        var result = m + Math.floor( Math.random() * (n-m+1) )
        var okay = true;
        for ( var i=0; i<l.length; i++ ) {
            if ( result == l[i] ) {
                okay = false;
            }
        }
        if ( okay ) {
            return result;
        } else {
            return randIntExclude(m,n,l);
        }
    }

    var new_numbers = [ 0, 0 ];
    new_numbers[0]  = randIntExclude( 3, 9, prev_numbers );
    new_numbers[1]  = randIntExclude( 3, 9, prev_numbers.concat( [ new_numbers[0] ] ) );
    prev_numbers    = new_numbers;
    return prev_numbers;
}

// makeExpStruct:
// create a block specification for the jspsych button_choice plugin
function makeExpStruct( parameters, mode, verbose ) {
    var specs = new Array( parameters.length );
    for ( var i=0; i<specs.length; i++ ) {
        specs[i]        = getTrialSpecs( parameters[i] );
        specs[i].data   = $.extend( {}, parameters[i], specs[i].data );
    }
    var exp_struct  = [ { "type": "button_choice", "mode": mode, "verbose": verbose, "ITI": 500, "progress": true, "specs": specs } ];
    // TBD: make ITI dependent on mode
    if ( verbose ) { console.log( "experiment.js > makeExpStruct > generated exp_struct with " + specs.length + " trials." ); }
    return( exp_struct );
}

// getTrialSpecs:
// create a list of trial specifications for the jspsych button_choice plugin
// each trial specification should include properties text, answers, key, and data
function getTrialSpecs( parameters ) {

    //// use condition to determine which question objects will serve as the basis for the trial
    
    var question_list   = getQuestionList();
    var question_idxs   = getPairIdxs( question_list.length )[ parameters.condition ];
    var question_pair   = [ question_list[question_idxs[0]], question_list[question_idxs[1]] ];
    
    //// First create the text block which will appear in the trial
    
    // use parameters for term order and base_num / exp_num to instantiate the question objects
    // (i.e. fill in their text templates with actual text, see instantiate below)
    question_pair[0].instantiate( parameters.q1_term_order, parameters.q1_base_num, parameters.q1_exp_num );
    question_pair[1].instantiate( parameters.q2_term_order, parameters.q2_base_num, parameters.q2_exp_num );
    
    // use parameters.question_order to select which questions will be displayed first and second
    if ( parameters.question_order==0 ) {
        var questions = [ question_pair[0], question_pair[1] ];
    } else if ( parameters.question_order==1 ) {
        var questions = [ question_pair[1], question_pair[0] ];
    }

    // put the questions into a 2-column table and add a question prompt at the end
    var text = "<table class='trial_text_table'><tr>"
        + "<td><p><strong>Problem A:</strong></p>" + questions[0].text + "</td>"
        + "<td><p><strong>Problem B:</strong></p>" + questions[1].text + "</td>"
        + "</tr></table>"
        + "<p>Click on the button which best describes the way the elements of the two problems correspond to each other.</p>";
        
    //// Next create the answers that will appear on the buttons underneath the above text block
    
    // an "answer" is an html string describing one way of mapping correspondences between terms in questions
    var createAnswer = function( q1_n1, q2_n1, q1_n2, q2_n2 ) {
        var result = "<table class='matching_response'>";
        result += "<tr><td>" + q1_n1 + "<td>correspond to</td><td>" + q2_n1 + "</td></tr>";
        result += "<tr><td>" + q1_n2 + "<td>correspond to</td><td>" + q2_n2 + "</td></tr>";
        result  += "</table>";
        return result;
    }
    
    // the terms on the left side of the answers come from whichever question was displayed on the left in "text" above
    // and they appear in the same order as was used to instantiate the question above
    // the terms on the right side of the answers come from the other of the two questions,
    // with one answer (the correct one) displaying them in the order corresponding to that used for the first question,
    // and the other answer (incorrect) displaying the terms in the opposite order
    if ( parameters.question_order==0 ) {
        var left_order = parameters.q1_term_order;
    } else if ( parameters.question_order==1 ) {
        var left_order = parameters.q2_term_order;
    }
    
    // create two answers, one correct and one incorrect
    if ( left_order==0 ) {
        var ans_correct     = createAnswer( questions[0].base_noun, questions[1].base_noun, questions[0].exp_noun, questions[1].exp_noun );
        var ans_incorrect   = createAnswer( questions[0].base_noun, questions[1].exp_noun, questions[0].exp_noun, questions[1].base_noun );
    } else if ( left_order==1 ) {
        var ans_correct     = createAnswer( questions[0].exp_noun, questions[1].exp_noun, questions[0].base_noun, questions[1].base_noun );
        var ans_incorrect   = createAnswer( questions[0].exp_noun, questions[1].base_noun, questions[0].base_noun, questions[1].exp_noun );
    }
    
    // use parameters.answer_order to put the answers in order, and record answer key
    if ( parameters.answer_order==0 ) {
        var answers = [ ans_correct, ans_incorrect ];
    } else if ( parameters.answer_order==1 ) {
        var answers = [ ans_incorrect, ans_correct ];
    }
    var key = parameters.answer_order;
    
    //// finally create a data object for the trial and return
    var data = {
        "q1_quesID": question_pair[0].quesID, "q1_schema": question_pair[0].schema,
        "q1_base_noun": question_pair[0].base_noun, "q1_exp_noun": question_pair[0].exp_noun,
        "q2_quesID": question_pair[1].quesID, "q2_schema": question_pair[1].schema,
        "q2_base_noun": question_pair[1].base_noun, "q2_exp_noun": question_pair[1].exp_noun,
        "key": parameters.answer_order
        };

    return { "text": text, "answers": answers, "key": key, "data": data };
        
}

var getPairIdxs = function( n ) {
    var result = [];
    for ( var i=0; i<n-1; i++ ) {
        for ( var j=i+1; j<n; j++ ) {
            result.push( [i,j] );
        }
    }
    // console.log( "getPairIdxs returned list of length " + result.length );
    return result;
}



//////////////////////////////////////////////////////////////////////////////////////////
// Question class and getQuestionList
// The question class is used for the question objects employed by getTrialSpecs
// getQuestionList returns an array of actual question objects, which constitute the stimuli for this exp
// This stuff is mostly based on Exp 6, but with some unneeded functionality removed
//////////////////////////////////////////////////////////////////////////////////////////

// Question
//  a Question object contains information about one stimulus for test or training
//  once the instantiate method has been called, the object can serve as a parameter array for jspsych_test or jspsych_training
Question = function( quesID, schema, base_noun, exp_noun, base_label, exp_label, text_long ) {
    this.schema         = schema;
    this.quesID         = quesID;
    this.text_long      = text_long;
    this.base_noun      = base_noun;
    this.exp_noun       = exp_noun;
    this.base_label     = base_label;
    this.exp_label      = exp_label;
    this.instantiate    = instantiateQuestion;
}

// instantiateQuestion: method of Question class
//  earlier versions generated parameters for question presentation,
//  but this revised version just takes given parameters and creates question text
var instantiateQuestion = function( order, base_num, exp_num ) {
    var fillers = [ [base_num, this.base_noun, exp_num, this.exp_noun], [exp_num, this.exp_noun, base_num, this.base_noun] ][ order ];
    this.text   = "<div class='question'>" + (this.text_long.format( fillers )) + "</div>";
    return this;
}


// getQuestionList returns an array of all the stimuli for this experiment
// They are based on exp 6 with minor revision (some but not all revisions noted)
// quesIDs are those used in exp 6 where applicable, except with some multiple of 100 added
// the questions which were used in exp 6 are: 101-106, 207-212, 421-426, and 527-532
function getQuestionList() {

    var questions = [
// PCO training questions

// problems 101-106 were used in exp 6
    
new Question( 101, "PCO", "meals", "friends", "meal", "friend",
    // as of exp 7, changed "person" to "friend" in sentences 2-3
    "<p>A group of friends is eating at a restaurant. Each friend chooses a meal from the menu. (It is possible for multiple friends to choose the same meal.)</p><p>In how many different ways can the friends choose their meals, if there are {0} {1} and {2} {3}?</p>" ), 

new Question( 102, "PCO", "pizza brands", "consumers", "pizza brand", "consumer",
    "<p>A marketing research company conducts a taste test survey. Several consumers are each asked to choose their favorite from among several pizza brands. (It is possible for multiple consumers to choose the same brand.)</p><p>How many different results of the survey are possible, if there are {0} {1} and {2} {3}?</p>" ), 

new Question( 103, "PCO", "majors", "students", "major", "student",
    "<p>Several college freshmen are discussing what they want to study in college. Each of them has to choose a major from a list of available majors. (Of course, it is possible for more than one to choose the same major.)</p><p>In how many different ways can the students choose their majors, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 104, "PCO", "types of toy", "children", "toy", "child",
    "<p>During playtime at a kindergarten, the teacher offers the children a number of different types of toy. Each child has to choose one type of toy. (There are enough toys of each type that more than one child, or even all of them, can choose the same type.)</p><p>In how many different ways can the children choose their toys, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 105, "PCO", "stocks", "bankers", "stock", "banker",
    "<p>Amy has decided to invest in one of several stocks. She asks several bankers for their advice, and each banker chooses one of the stocks to advise her to buy. (It is possible for more than one banker to choose the same stock.)</p><p>In how many different ways can the bankers choose stocks, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 106, "PCO", "trails", "hikers", "trail", "hiker",
    // changed "choose the same" to "hike on the same" in the parenthetical expression
    "<p>Several hikers go hiking at a national park that has numerous hiking trails. Each hiker chooses one of the trails to hike on. (It is possible for more than one hiker to hike on the same trail.)</p><p>In how many different ways can the hikers choose trails, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 107, "PCO", "horses", "gamblers", "horse", "gambler",
    "<p>Several gamblers are watching a horse race. Each of them bets on one of the horses to win. (More than one gambler can bet on the same horse.)</p><p>In how many different ways can the gamblers place their bets, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 108, "PCO", "signs", "fans", "sign", "fan",
    "<p>Fans attending the basketball game are given a sign with admission to the game. Each fan chooses from several different signs offered, such as \"D-fense,\" \"play hard,\" \"get loud,\" etc. (The same sign can be chosen by more than one fan.)</p><p>In how many different ways can the fans choose their signs, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 109, "PCO", "songs", "singers", "song", "singer",
    "<p>At an audition for singers, several singers receive a list of songs, and each one has to pick one of the songs to sing. (It is possible for more than one singer to choose the same song.)</p><p>In how many different ways can the singers pick their songs, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 110, "PCO", "spa packages", "vacationers", "package", "vacationer",
    "<p>A group of vacationers go to their resort spa, where various spa packages are offered. Each person chooses a spa package. (It is possible for multiple people to choose the same spa package.)</p><p>In how many different ways can the vacationers pick their spa packages, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 111, "PCO", "types of bat", "players", "bat", "player",
    "<p>During batting practice for a baseball team, the coach offers the players a variety of different bats to use, e.g. wood, aluminum, hybrid, etc. Each player picks out one of these. (There are enough bats of each type that more than one player, or even all of them, can choose the same type.)</p><p>In how many different ways can the baseball team pick their bat, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 112, "PCO", "essays", "judges", "essay", "judge",
    "<p>A local organization is holding an essay competition. To determine which essay will qualify for the next round, the judges of the competition must each vote for their favorite essay. (It is possible for a single essay to receive more than one vote, but each judge has only one vote.)</p><p>In how many ways can the judges cast their votes, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 113, "PCO", "parts available", "actors trying out", "part", "actor",
    "<p>Several actors come to try out for a play, and there are several parts available. However, a given actor can only try out for one part. (It is possible for more than one actor to try out for the same part.)</p><p>In how many different ways can the actors try out for parts, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 114, "PCO", "star ratings", "critics", "star", "critic",
    "<p>Several restaurant critics all rate the same restaurant using a star rating system, i.e. from one star to the maximum number of stars. Each critic rates the restaurant separately (but it is possible that more than one critic might give the same rating).</p><p>In how many different ways can the critics rate the restaurant, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 115, "PCO", "issues", "candidates", "issue", "candidate",
    "<p>In a primary election for a political party, there are several hot political issues, such as reducing crime, improving education, reining in the deficit, and so on.  Each candidate in the primary decides to focus on one of these issues as the center of their campaign.  (More than one candidate might focus on the same issue.)</p><p>In how many different ways can the issues be selected by the candidates, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 116, "PCO", "textbooks", "history teachers", "textbook", "teacher",
    "<p>In a certain high school, there are several different textbooks used for a world history course.  Each history teacher can use whichever textbook he or she prefers.  (The same textbook can be used by more than one teacher.)</p><p>In how many different ways can textbooks be selected by the history teachers, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 117, "PCO", "crimes", "journalists", "crime", "journalist",
    "<p>In a certain city, several major crimes occurred in the past week.  The crime journalists working at the city's newspapers each must decide which of these crimes to report on.  (The journalists work at different newspapers, so more than one could report on the same crime.)</p><p>In how many different ways can the journalists report on the crimes, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 118, "PCO", "presentations occurring at the same time", "professors", "presentation", "professor",
    "<p>Several professors from the same university are attending a conference.  There are several presentations occurring at the same time, so each professor can only attend one of them.  (However, more than one professor can attend the same presentation.)</p><p>In how many different ways can the professors attend the presentations, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 119, "PCO", "topics", "contestants", "topic", "contestant",
    "<p>On a TV game show, during each round, each contestant must answer a trivia question correctly in order to move on to the next round.  The contestants can pick the topic of the question they will answer from the topics available.  (The same topic can be chosen by more than one contestant.)</p><p>In a given round, in how many different ways can the contestants pick their topics, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 120, "PCO", "famous buildings", "painters", "building", "painter",
    "<p>Several painters visit a city famous for its beautiful architecture.  Each painter paints one of the famous buildings in the city.  (More than one of them might paint the same building.)</p><p>In how many different ways can the painters select which buildings to paint, if there are {0} {1} and {2} {3}?</p>" ),    
    
// OSS training questions

new Question( 201, "OSS", "hotels that she likes", "trips to Berlin", "hotel", "trip",
    "<p>Sheila goes to Berlin on business several times each year, and each time she goes, she stays at one of several hotels that she likes. (There might be more than one time when she stays at the same hotel.)</p><p>In how many different ways could she plan her hotel stays this year, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 202, "OSS", "plot elements", "scenes in a script", "element", "scene",
    "<p>ScriptWriter Pro is a software that helps script writers come up with movie scripts by randomly generating script outlines. A script outline contains a certain number of scenes, with each scene containing a single plot element, such as \"exposition,\" \"action,\" \"suspense,\" and so on. (The same plot element could be used more than once in a script outline.)</p><p>How many different script outlines are possible, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 203, "OSS", "moves that she has learned", "moves in one message", "move", "position",
    "<p>Felicia is learning flag semaphore, a system for sending messages by making different moves with flags held in each hand. She can send different messages by making different moves in different sequences. (It is possible to make the same move more than once in a message.)</p><p>How many different messages can Felicia send, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 204, "OSS", "games on his phone", "hours to kill", "game", "hour",
    "<p>Suppose Jose has several hours to kill. He spends each hour playing one of the games on his phone. (He might play the same game on more than one hour.)</p><p>In how many different ways can he kill the time, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 205, "OSS", "distinct hieroglyphs", "hieroglyphs in each sentence", "hieroglyph", "sentence position",
    "<p>Archaeologists discover records of an ancient language whose writing system was based on hieroglyphs.  Strangely, each sentence in the language contained the same number of hieroglyphs (and a given hieroglyph could be repeated multiple times within a sentence).</p><p>How many different sentences were possible in this language, if there were {0} {1} and {2} {3}?</p>" ),
    
// problems 206-212 were used in exp 6
    
new Question( 206, "OSS", "shops in the shopping center", "pages in a booklet", "shop", "page",
    "<p>A clerk at a shopping center passes out coupon booklets to shoppers.  Each page of the booklets contains a coupon for one of the shops in the center, selected randomly.  (It is possible for more than one page to contain coupons for the same shop.)</p><p>How many different coupon booklets are possible, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 207, "OSS", "keys in the set", "notes in each melody", "key", "note",
    "<p>A piano student, when bored, plays random melodies on the piano. Each melody is the same number of notes long, and uses only keys from a fixed set of keys. (It is possible to play the same key more than once in a sequence.)</p><p>How many different melodies are possible, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 208, "OSS", "allowable letters", "letters in each password", "letter", "position",
    "<p>A website generates user passwords by selecting a certain number of letters randomly from a set of allowable letters. (It is possible to use the same letter more than once in a password.)</p><p>How many different passwords are possible, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 209, "OSS", "buttons", "flashes per sequence", "button", "flash", 
    "<p>The game Simon uses a disk with several different-colored buttons. The buttons flash in sequence and then the player has to push the buttons in the same sequence - otherwise they get a shock. (It is possible for the same button to flash more than once in a sequence.)</p><p>How many different sequences are possible, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 210, "OSS", "permissible numbers", "numbers on each ticket", "number", "position",
    "<p>In a certain city, municipal lottery tickets are printed using series of numbers chosen randomly from a list of permissible numbers. (It is possible for the same number to appear at more than one position in a series.)</p><p>How many different lottery tickets are possible, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 211, "OSS", "answers for each question", "questions on the exam", "answer", "question",
    "<p>A student is taking a multiple choice exam. Each question has the same number of answers and the student just chooses an answer randomly. (It is possible for him to choose the same answer for more than one question.)</p><p>In how many different ways can he fill out the exam, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 212, "OSS", "dresses", "days with dances", "dress", "day",
    "<p>Elizabeth is going to attend a dance every day for the next several days. Each day, she chooses a dress to wear to the dance. (It is possible for her to choose the same dress on more than one day.)</p><p>In how many different ways can she choose her dresses, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 213, "OSS", "modes of transport", "legs of the trip", "mode", "leg",
    "<p>Tonia is taking a trip from Chicago to Los Angeles, passing through several cities on the way. On each leg of the trip, she can use any of several modes of transport, such as bus, train, or airplane. (There might be more than one leg of the trip for which she uses the same mode of transport.)</p><p>In how many different ways can she travel from Chicago to Los Angeles, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 214, "OSS", "controller buttons", "button presses per combination", "controller button", "button press",
    "<p>In a video game about martial arts fighting, you can make a character do cool moves by pressing several buttons on the controller in a certain order, such as \"up-left-down-...\". Each combination consists of the same number of button presses. (The same button might need to be pressed more than once in a given combination.)</p><p>How many different combinations are possible, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 215, "OSS", "possible hand gestures", "gestures in a handshake", "possible movement", "movement position",
    "<p>The Gamma Gamma Gamma fraternity wants to invent a special handshake for fraternity brothers. The handshake will involve a series of hand gestures such as bumping fists, high five, or thumbs-up. (It is possible to repeat the same gesture more than once during the handshake.)</p><p>How many different handshakes are possible, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 216, "OSS", "different words", "words per line", "word", "position",
    "<p>Suppose Phil owns a \"magnetic poetry\" set which can be used to create lines of poetry by sticking magnetic words onto the refrigerator. Suppose he creates different lines which all contain the same number of words. (He has an unlimited supply of each word, so he can use the same word more than once in a single line.)</p><p>How many different lines of poetry can Phil create if there are {0} {1} and {2} {3}?</p>" ),

new Question( 217, "OSS", "bead materials", "beads on each bracelet", "material", "bead",
    "<p>A jeweler makes bracelets by stringing together beads made of different materials, such as gold, silver, titanium, etc. Each bracelet has the same number of beads on it. (It is possible for the same bead material to be repeated more than once on a single bracelet.)</p><p>How many different bracelets are possible, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 218, "OSS", "flavors", "layers in each cake", "flavor", "layer",
    "<p>A baker is making layer cakes by selecting various flavors of cakes to stack in layers.  He chooses the layer flavors randomly from the selection of flavors he has in his store, such as chocolate, vanilla, red velvet, etc. (It is possible to use the same flavor more than once in a cake.)</p><p>How many different layer cakes are possible if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 219, "OSS", "breeds of flower", "flowers per row", "breed", "flower",
    "<p>A large mansion grows many breeds of flower, like roses, pansies, and irises, which are used to decorate the mansion.  The housekeeper places a row of flowers on each window sill, using the same number of flowers in each row, but varying the specific breeds and their order.  (The same breed can be used more than once in a row.)</p><p>How many different rows of flowers are possible, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 220, "OSS", "cellphone models", "phones in each row", "model", "position",
    "<p>Each display case in a cellphone store contains a row of cellphones selected from the models currently on sale.  The cases are all the same size, so there are the same number of phones in each row.  (A given cellphone model might appear multiple times in a single row, for example if it is a very popular phone.)</p><p>How many different ways are there to fill a display case, if there are {0} {1} and {2} {3}?</p>" ),

// TFR training questions

new Question( 301, "TFR", "fonts", "document styles", "font", "document style",
    "<p>In Microsoft Word, different document styles are used to format text in different parts of the document, such as \"title,\" \"chapter heading,\" \"sub-section heading,\" etc. A font must be assigned to each document style. (It is possible to assign the same font to more than one document style.)</p><p>In how many ways can fonts be assigned to document styles, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 302, "TFR", "ring tones", "types of ring", "ring tone", "type of ring",
    "<p>A smartphone comes pre-loaded with various ring tones.  For each type of ring, such as \"incoming call,\" \"alarm,\" \"new mail,\" etc., you can set any of the ring tones. (It is possible to set the same ring tone for multiple types of ring.)</p><p>In how many different ways can types of ring be set with ring tones, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 303, "TFR", "icons", "triggers", "icon", "trigger",
    "<p>Suppose the settings on a computer allow one to set what kind of icon is used for the mouse pointer, e.g. an arrow, a hand, a vertical line, etc. Icons can be set separately for a variety of \"triggers,\" like \"clicking something,\" \"hovering over a link,\" \"waiting for something,\" and so on. (The same icon could be set for more than one trigger.)</p><p>In how many different ways can icons be set for triggers, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 304, "TFR", "devices", "activities", "device", "activity",
    "<p>Sharon owns many different electronic devices, like a desktop computer, laptop computer, smartphone, etc., which she uses for activities like homework, surfing the net, and email. For a given activity, she always uses the same device. (She might use the same device for more than one activity.)</p><p>In how many different ways can she choose devices for activities, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 305, "TFR", "shapes", "occasions", "shape", "occasion",
    "<p>Tanisha the baker makes cakes for all occasions, like birthdays, weddings, and anniversaries. She likes to make cakes in different shapes, e.g. round, square, or oval, but for any given occasion, she always uses the same shape. (However, there might be more than one occasion for which she uses the same shape.)</p><p>In how many different ways could she assign shapes of cake to occasions, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 306, "TFR", "screen savers", "types of software", "screen saver", "software",
    "<p>Alma's new computer comes with multiple different screen savers. The screen saver can be set separately depending on what kind of software is open on the computer, so that, for example, Alma could set one screen saver to activate when using Office software, another for internet browsers, another for games, and so on. (It is also possible to set the same screen saver for more than one type of software.)</p><p>In how many different ways can the screen savers be set up, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 307, "TFR", "types of bark", "kinds of truffle", "bark", "truffle",
    "<p>Darren is training his dog to hunt truffles. He trains it to bark differently depending on what kind of truffle it finds: for example, a sharp yip for white truffles, a loud bark for black truffles, a growl for burgundy truffles, and so on. (However, he might train the dog to make the same bark for more than one kind of truffle.)</p><p>In how many different ways can Darren train his dog, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 308, "TFR", "weapons", "enemies", "weapon", "enemy",
    "<p>Brandi plays an Orc Barbarian in World of Warcraft. She has many weapons, like axe, sword, and spear, but she always uses the same weapon for a particular kind of enemy, such as humans, elves, and dwarves. (There might be more than one kind of enemy for which she uses the same weapon.)</p><p>In how many different ways can Brandi choose weapons for different enemies, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 309, "TFR", "pairs of sneakers", "sports that he plays", "pair of sneakers", "sport",
    "<p>Virgil owns many pairs of sneakers and decides which one to wear depending on what sport he is going to play. For example, he might wear one pair for jogging, another for basketball, another for tennis, and so on. (There might be more than one sport for which he wears the same pair of sneakers.)</p><p>In how many different ways could he match sneakers with sports, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 310, "TFR", "sets of china", "types of guest", "set", "guest",
    "<p>A rich family has several sets of china to use for meals. For each type of guest, there is a particular set of china they use, e.g. one set of china for family, one for friends, and one for business acquaintances. (There might be more than one type of guest for which they use the same set of china.)</p><p>In how many different ways could sets of china be matched to types of guests, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 311, "TFR", "paper grades", "document categories", "grade", "category",
    "<p>A print shop has several different grades of paper, and uses a particular grade of paper for each category of document that it prints, e.g. glossy paper for posters, book paper for business documents, bond paper for resumes, etc. (The same paper grade could be used for more than one document category.)</p><p>In how many different ways could paper grades be matched to document categories, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 312, "TFR", "knives", "different foods", "knife", "food",
    "<p>Russell has a few different knives in his kitchen, such as a chef's knife, a paring knife, a cleaver, etc.  For a given food, like vegetables, bread, or meat, he always cuts it with the same knife (but he might use the same knife for more than one food).</p><p>In how many different ways could Russell use knives for food, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 313, "TFR", "fragrances", "product variants", "fragrance", "variant",
    "<p>A company that makes personal care products is launching a new line of soap that includes several product variants, e.g. anti-perspirant soap, soap for sensitive skin, refreshing soap, and so on.  The product designer must give each product variant a fragrance, like lemon, lavender, or mint.  (More than one product variant could get the same fragrance.)</p><p>How many ways are there to pair fragrances with product variants, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 314, "TFR", "types of symbol", "types of building", "symbol", "building",
    "<p>Suppose you are designing a map and you have several types of symbol which can be used to represent different types of building.  For example, red hearts could represent hospitals, yellow rectangles could represent schools, and so on.  (The same type of symbol could represent more than one type of building, since you might not need to distinguish between some types of building.)</p><p>In how many ways could symbols be matched to buildings, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 315, "TFR", "bags", "types of outing", "bag", "outing",
    "<p>Milton owns several different bags, like a backpack, a suitcase, a duffel bag, and so on.  For a given type of outing, like going to school, going camping, or traveling, he always takes the same bag.  (However, there might be more than one type of outing for which he takes the same bag.)</p><p>In how many different ways could Milton match up bags with types of outing, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 316, "TFR", "kinds of chart", "data sets", "chart", "data set",
    "<p>Suppose you are preparing a report about the population of a certain city, which will include various data sets about things like sex, age, and income.  Each data set should be displayed using one of several kinds of chart, such as pie chart, bar chart, or line graph.  (Of course, more than one data set can be displayed using the same kind of chart.)</p><p>In how many different ways could data sets be matched up with kinds of chart, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 317, "TFR", "destinations", "holidays", "destination", "holiday",
    "<p>A travel agency holds a promotion during several holidays during the year, like Thanksgiving, Christmas, Spring Break, etc.  For each holiday, they offer discounted travel to one out of of several possible travel destinations.  (They might give discounts to the same destination for more than one holiday.)</p><p>In how many different ways could the agency match destinations to holidays, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 318, "TFR", "competing companies", "development projects", "company", "project",
    "<p>A city government is planning several urban development projects, including a new bridge, a library, and a park.  For each project, the government will contract with one of several construction companies to carry it out.  (They might contract with the same company for more than one project.)</p><p>In how many different ways could the government assign contracts for the projects, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 319, "TFR", "email addresses", "kinds of website", "address", "website",
    "<p>Brandon has several email addresses.  When he enters his email address in a website, he always uses the same address for a given type of website, so he could use one address for social networks, a different one for online banking, and so on.  (However, he could use the same address for more than one kind of website.)</p><p>In how many different ways could Brandon pair up addresses with kinds of website, if there are {0} {1} and {2} {3}?</p>" ),
    
new Question( 320, "TFR", "kinds of diagram", "concepts", "diagram", "concept",
    "<p>A teacher is presenting a lesson involving many difficult concepts, so she illustrates each concept with a diagram, e.g. a Venn diagram, a tree diagram, a flowchart, etc.  (She could illustrate more than one concept with the same kind of diagram.)</p><p>In how many different ways could she assign diagrams to concepts, if there are {0} {1} and {2} {3}?</p>" ),

// test set 1

// all of these problems were used in exp 6

new Question( 421, "OAPlc", "colors", "rooms", "color", "room",
    "<p>A homeowner is going to repaint several rooms in her house. She chooses one color of paint for the living room, one for the dining room, one for the family room, and so on. (It is possible for multiple rooms to be painted the same color.)</p><p>In how many different ways can she paint the rooms, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 422, "CAE", "categories", "paranormal events", "category", "event",
    "<p>An FBI agent is investigating several paranormal events. She must write a report classifying each event into a category such as Possession, Haunting, Werewolf, and so on.</p><p>In how many different ways can she write her report, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 423, "OAPpl", "employees", "prizes", "employee", "prize",
    "<p>A prize drawing is held at a small office party, and each of several prizes is awarded to one of the employees. (It is possible for multiple prizes to be awarded to the same employee.)</p><p>In how many different ways can the prizes be awarded, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 424, "PCO", "fishing spots", "fishermen", "spot", "fisherman",
    "<p>Several fishermen go fishing in the same lake, and each of them chooses one of several spots at which to fish. (It is possible for more than one fisherman to choose the same spot.)</p><p>In how many different ways can the fishermen choose their spots, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 425, "OSS", "types of wine", "courses in the meal", "type of wine", "course",
    "<p>A gourmet chef is preparing a fancy several-course meal. There are several types of wine available, and the chef needs to choose one wine to serve with each course. (It is possible for the same wine to be served with more than one course.)</p><p>In how many different ways can the wines be chosen, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 426, "OAPpl", "sons", "houses", "son", "house",
    "<p>A wealthy old woman is writing her will. She owns several houses, and wishes to leave each house to one of her sons. (It is possible for her to leave more than one house to the same son.)</p><p>In how many different ways can she write this part of her will, if there are {0} {1} and {2} {3}?</p>" ),

// test set 2

// all of these problems were used in exp 6

new Question( 527, "OAPlc", "crops", "fields", "crop", "field",
    "<p>A farmer is planning what crops he will plant this year. He chooses one crop for each of several fields. (It is possible for multiple fields to receive the same crop.)</p><p>In how many different ways can the farmer plant his crops, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 528, "CAE", "categories", "weather events", "category", "event", 
    "<p>A meteorologist must write a report classifying each extreme weather event which occurred in the past year into a category such as Hurricane, Tropical Storm, etc.</p><p>In how many different ways can he write his report, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 529, "OAPpl", "children", "provinces", "child", "province",
    "<p>An aging king plans to divide his lands among his heirs. Each province of the kingdom will be assigned to one of his many children. (It is possible for multiple provinces to be assigned to the same child.)</p><p>In how many different ways can the provinces be assigned, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 530, "PCO", "treatments", "doctors", "treatment", "doctor",
    "<p>There are several possible treatments for a certain rare disease. A patient with this disease consults several doctors, and each doctor recommends one of the possible treatments. (It is possible for more than one doctor to recommend the same treatment.)</p><p>In how many different ways can the doctors make their recommendations, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 531, "OSS", "colognes to choose from", "dates", "cologne", "date", 
    "<p>Don Juan has one date with each of a merchant's daughters. For each date, he puts on a cologne he thinks that daughter will like. (It is possible for him to choose the same cologne for more than one date.)</p><p>In how many different ways can he choose colognes for his dates, if there are {0} {1} and {2} {3}?</p>" ),

new Question( 532, "OAPpl", "detectives", "cases", "detective", "case", 
    "<p>A police department receives several new cases in one day. Each new case is assigned to one of the detectives. (It is possible for multiple cases to be assigned to the same detective.)</p><p>In how many different ways can the cases be assigned, if there are {0} {1} and {2} {3}?</p>" )
    
        ];
    
    return questions;

}




function OLDrunExperiment( condition ) {

    // convert condition number into factor assignments
    var factors         = conditionToFactors( condition );
    var condFrame       = factors["condFrame"];     // whether verbal, graphical, or no representational frame is given for the underlying structure during training
    var condVariation   = factors["condVariation"]; // whether the training examples are varied or nonvaried
    var condVersion     = factors["condVersion"];   // whether the first training example is OAPlc or ROAPlc schema
    var condTestSeq     = factors["condTestSeq"];   // which test problem set is used as pretest and which as posttest
    console.log( "experiment.html > runExperiment > factors assigned. condFrame: " + condFrame + "; condVariation: " + condVariation + "; condVersion: " + condVersion + "; condTestSeq: " + condTestSeq );
    
    // create experiment structure
    var exp_struct  = makeExpStruct( condFrame, condVariation, condVersion, condTestSeq, sections, mode );
    console.log( "experiment.html > runExperiment > exp_struct length " + exp_struct.length );
    
    // record start time
    var start_time          = new Date();
    var start_time_txt      = dateToString( start_time );
    console.log( "experiment.html > runExperiment > starting experiment at " + start_time_txt );

    // run the experiment
    jsPsych.init($('#target'), {
        "experiment_structure": exp_struct,
		"plugins": [ // TBD
			{"type": "survey", "src": "jspsych-survey.js"},
            {"type": "scmvar_test", "src": "jspsych-scmvar.js"},
            {"type": "scmvar_training", "src": "jspsych-scmvar.js"}
		],
        "finish": function( data ) {
            // record end time
            var end_time        = new Date();
            var end_time_txt    = dateToString( end_time );
            var total_time_min  = (( end_time.getTime() - start_time.getTime() ) / ( 60 * 1000 )).toFixed(2);
            var subj_data       = { "subjid": subjid, "testing": testing.toString(), "mode": mode,
                                    "condition": condition, "condFrame": condFrame, "condVariation": condVariation, "condVersion": condVersion, "condTestSeq": condTestSeq,
                                    "start": start_time_txt, "end": end_time_txt, "time": Number(total_time_min) };
            var final_data      = prependData( subj_data, data );
            console.log( "experiment.html > runExperiment jsPsych run complete. final data follows." );
            console.log( JSON.stringify(final_data) );
            if ( offline ) {
                console.log( "experiment.html > runExperiment in offline mode, skipping data submission." );
                showExitPage( JSON.stringify(final_data) );
            } else {
                $.ajax( { type: 'post',
                          cache: false,
                          url: 'submit_data.php',
                          data: { 
                            'table': table,
                            'json': JSON.stringify(final_data) },
                          success: function(data) {
                            console.log( "experiment.html > runExperiment: submit_data succeeded." );
                            showExitPage( final_data );
                          },
                          error: function(data) {
                            console.log( "experiment.html > runExperiment: submit_data failed with error " + data.statusText );
                            showExitPage( final_data );
                          }
                        } );
            }
        } } ) ;

}


