//////////////////////////////////////////////////////////////////////////////////////////
// displayButtonChoice and getTrialSpecs
// displayButtonChoice displays trial content and sets it to respond to user input
// getTrialSpecs generates the content for displayButtonChoice
//////////////////////////////////////////////////////////////////////////////////////////

// displayButtonChoice
// in target_div, displays a block of text contained in specs.text
// followed by vertically laid-out answer buttons with content contained in specs.answers
// when a button is pressed, if live is true, saves specs.data, response, and accuracy to data, then calls on_select
function displayButtonChoice( target_div, live, on_select, specs, data ) {

    console.log( "content.js > displayTrial called. live: " + live );

    // display trial content to target div
    var content = specs.text;
    for ( var i=0; i<specs.answers.length; i++ ) {
        content += "<p><button id='button_" + i + "' type='button' class='trial_answer_button'>" + specs.answers[i] + "</button></p>";
    }
    target_div.html( content );

    // set answer buttons to react appropriately when clicked
    if ( live ) {
        for ( var i=0; i<specs.answers.length; i++ ) {
            $('#button_'+i).click( function() {
                // highlight clicked button and un-highlight all others
                for ( var j=0; j<specs.answers.length; j++ ) {
                    $('#button_'+j).removeClass('selected');
                }
                $(this).addClass('selected');
                // record response and accuracy
                data.response = Number( $(this).attr('id').slice(7) );
                data.accuracy = Number( data.response==data.key );
                console.log( "displayButtonChoice > response logged: " + data.response );
                // call on_select (this can e.g. activate an external submit button)
                on_select();
                } );
        }
    } else {
        for ( var i=0; i<specs.answers.length; i++ ) {
            $('#button_'+i).attr( 'disabled', 'disabled' );
        }
    }        
}


// getTrialSpecs
// creates content for displayButtonChoice, including the following:
// text: a block of text which contains the text from two question objects in parallel columns,
//  followed by a prompt to indicate how the terms (nouns) in one question correspond to those in the other
// answers: two descriptions of the two possible ways in which the elements in one question object could correspond to those in the other
// data: information about the question objects, together with an answer key
function getTrialSpecs( condition, parameters ) {

    //// use condition to determine which question objects will serve as the basis for the trial
    
    var question_list   = getQuestionList();
    var question_idxs   = getPairIdxs( question_list.length )[ condition ];
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
    
    // use parameters.answer_order to put the answers in order
    if ( parameters.answer_order==0 ) {
        var answers = [ ans_correct, ans_incorrect ];
    } else if ( parameters.answer_order==1 ) {
        var answers = [ ans_incorrect, ans_correct ];
    }
    
    //// finally create a data object for the trial and return
    var data = {
        "q1_quesID": question_pair[0].quesID, "q1_schema": question_pair[0].schema,
        "q1_base_noun": question_pair[0].base_noun, "q1_exp_noun": question_pair[0].exp_noun,
        "q2_quesID": question_pair[1].quesID, "q2_schema": question_pair[1].schema,
        "q2_base_noun": question_pair[1].base_noun, "q2_exp_noun": question_pair[1].exp_noun,
        "key": parameters.answer_order
        };

    return { "text": text, "answers": answers, "data": data };
        
}

var getPairIdxs = function( n ) {
    var result = [];
    for ( var i=0; i<n-1; i++ ) {
        for ( var j=i+1; j<n; j++ ) {
            result.push( [i,j] );
        }
    }
    console.log( "getPairIdxs returned list of length " + result.length );
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
Question = function( schema, quesID, base_noun, exp_noun, base_label, exp_label, text_long ) {
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
// They are based on exp 6 with minor revision; quesIDs are consistent with exp 6 where possible
function getQuestionList() {

    var questions = [
        // PCO training questions
        new Question( "PCO", 1, "meals", "friends", "meal", "friend",
            "<p>A group of friends is eating at a restaurant. Each person chooses a meal from the menu. (It is possible for multiple people to choose the same meal.)</p><p>In how many different ways can the friends choose their meals, if there are {0} {1} and {2} {3}?</p>" ), 
        new Question( "PCO", 2, "pizza brands", "consumers", "pizza brand", "consumer",
            "<p>A marketing research company conducts a taste test survey. Several consumers are each asked to choose their favorite from among several pizza brands. (It is possible for multiple consumers to choose the same brand.)</p><p>How many different results of the survey are possible, if there are {0} {1} and {2} {3}?</p>" ), 
        new Question( "PCO", 3, "possible majors", "students", "major", "student", 
            "<p>Several college freshmen are discussing what they want to study in college. Each of them has to choose a major from a fixed list of options. (Of course, it is possible for more than one to choose the same major.)</p><p>In how many different ways can the students choose their majors, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "PCO", 4, "types of toy", "children", "toy", "child",
            "<p>During playtime at a kindergarten, the teacher offers the children a number of different types of toy. Each child has to choose one type of toy. (There are enough toys of each type that more than one child, or even all of them, can choose the same type.)</p><p>In how many different ways can the children choose their toys, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "PCO", 5, "stocks", "bankers", "stock", "banker",
            "<p>Amy has decided to invest in one of several stocks. She asks several bankers for their advice, and each banker chooses one of the stocks to advise her to buy. (It is possible for more than one banker to choose the same stock.)</p><p>In how many different ways can the bankers choose stocks, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "PCO", 6, "trails", "hikers", "trail", "hiker",
            "<p>Several hikers go hiking at a national park that has numerous hiking trails. Each hiker chooses one of the trails to hike on. (It is possible for more than one hiker to choose the same trail.)</p><p>In how many different ways can the hikers choose trails, if there are {0} {1} and {2} {3}?</p>" ),
        // OSS training questions
        new Question( "OSS", 7, "keys in the set", "notes in each melody", "key", "note",
            "<p>A piano student, when bored, plays random melodies on the piano. Each melody is the same number of notes long, and uses only keys from a fixed set of keys. (It is possible to play the same key more than once in a sequence.)</p><p>How many different melodies are possible, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OSS", 8, "allowable letters", "letters in each password", "letter", "position",
            "<p>A website generates user passwords by selecting a certain number of letters randomly from a set of allowable letters. (It is possible to use the same letter more than once in a password.)</p><p>How many different passwords are possible, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OSS", 9, "buttons", "flashes per sequence", "button", "flash", 
            "<p>The game Simon uses a disk with several different-colored buttons. The buttons flash in sequence and then the player has to push the buttons in the same sequence - otherwise they get a shock. (It is possible for the same button to flash more than once in a sequence.)</p><p>How many different sequences are possible, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OSS", 10, "permissible numbers", "numbers on each ticket", "number", "position",
            "<p>In a certain city, municipal lottery tickets are printed using series of numbers chosen randomly from a list of permissible numbers. (It is possible for the same number to appear at more than one position in a series.)</p><p>How many different lottery tickets are possible, if there are {0} {1} and {2} {3}?</p>",
            "<p>Now suppose there are {0} {1} and {2} {3}. How many different lottery tickets are possible now?</p>" ),
        new Question( "OSS", 11, "answers for each question", "questions on the exam", "answer", "question",
            "<p>A student is taking a multiple choice exam. Each question has the same number of answers and the student just chooses an answer randomly. (It is possible for him to choose the same answer for more than one question.)</p><p>In how many different ways can he fill out the exam, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OSS", 12, "dresses", "days with dances", "dress", "day",
            "<p>Elizabeth is going to attend a dance every day for the next several days. Each day, she chooses a dress to wear to the dance. (It is possible for her to choose the same dress on more than one day.)</p><p>In how many different ways can she choose her dresses, if there are {0} {1} and {2} {3}?</p>" ),
        // OAPlc training questions
        new Question( "OAPlc", 13, "public works", "city districts", "public work", "city district",
            "<p>A city is planning to build new public works, such as libraries, parks, bridges, etc. <span id='contrast'>In each city district, the government must decide which public work to build. They could build the same public work in more than one district, but they will not build more than one public work in a given district.</span></p><p>In how many different ways can they make their decisions, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OAPlc", 14, "browsers", "computers", "browser", "computer",
            "<p>An IT manager is installing internet browsers, like IE, Firefox, and Chrome, on some office computers. <span id='contrast'>One browser will be installed on each computer. The same browser could be installed on more than one computer, but a given computer will not have more than one browser installed.</span></p><p>In how many different ways can he choose which browsers are installed on which computers, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OAPlc", 15, "countries", "exhibit halls", "country", "exhibit hall",
            "<p>A museum is planning to use several of its exhibit halls to show modern art from various countries, such as France, Germany, and the USA. <span id='contrast'>Each exhibit hall will be used to display art from one of the countries. The same country's art might be displayed in more than one hall, but a single hall will not display art from more than one country.</span></p><p>In how many different ways can the museum choose which countries to display in which exhibit halls, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OAPlc", 16, "different nuts", "hiding places", "nut", "hiding place", 
            "<p>A squirrel collects various different kinds of nuts, like walnuts, chestnuts, peanuts, etc. <span id='contrast'>The squirrel will use each of several hiding places to hide one kind of nut. It might hide the same kind of nut in more than one hiding place, but it will not hide more than one kind of nut in a given hiding place.</span></p><p>In how many different ways can the squirrel hide his nuts, if there are {0} {1} and {2} {3}?</p>" ),
        // ROAPlc training questions
        new Question( "ROAPlc", 17, "city districts", "public works", "district", "public work",
            "<p>A city is planning to build new public works, such as libraries, parks, bridges, etc. <span id='contrast'>For each public work, the government must decide in which city district to build it. They could build more than one public work in a given district, but they will not build the same public work in more than one district.</span></p><p>In how many different ways can they make their decisions, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "ROAPlc", 18, "computers", "browsers", "computer", "browser", 
            "<p>An IT manager is installing internet browsers, like IE, Firefox, and Chrome, on some office computers. <span id='contrast'>Each browser will be installed on one of the computers.  A given computer could have more than one browser installed on it, but the same browser cannot be installed on more than one computer, because of licensing requirements.</span></p><p>In how many different ways can he choose which browsers are installed on which computers, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "ROAPlc", 19, "exhibit halls", "countries", "exhibit hall", "country",
            "<p>A museum is planning to use some of its exhibit halls to show modern art from various countries, such as France, Germany, and the USA. <span id='contrast'>One of the exhibit halls will be used to display art from each country. A single hall might display art from more than one country, but the same country's art will not be displayed in more than one hall.</span></p><p>In how many different ways can the museum choose which countries to display in which exhibit halls, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "ROAPlc", 20, "hiding places", "different nuts", "hiding place", "nut",
            "<p>A squirrel has collected several different nuts, including a walnut, a chestnut, a peanut, etc. <span id='contrast'>The squirrel will use one of several hiding places for each nut. It might hide more than one nut in the same hiding place, but it only has one nut of each kind, so it cannot hide the same kind of nut in more than one hiding place.</span></p><p>In how many different ways can the squirrel hide his nuts, if there are {0} {1} and {2} {3}?</p>" ),
        // test set 1
        new Question( "OAPlc", 21, "colors", "rooms", "color", "room",
            "<p>A homeowner is going to repaint several rooms in her house. She chooses one color of paint for the living room, one for the dining room, one for the family room, and so on. (It is possible for multiple rooms to be painted the same color.)</p><p>In how many different ways can she paint the rooms, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "CAE", 22, "categories", "paranormal events", "category", "event",
            "<p>An FBI agent is investigating several paranormal events. She must write a report classifying each event into a category such as Possession, Haunting, Werewolf, and so on.</p><p>In how many different ways can she write her report, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OAPpl", 23, "employees", "prizes", "employee", "prize",
            "<p>A prize drawing is held at a small office party, and each of several prizes is awarded to one of the employees. (It is possible for multiple prizes to be awarded to the same employee.)</p><p>In how many different ways can the prizes be awarded, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "PCO", 24, "fishing spots", "fishermen", "spot", "fisherman",
            "<p>Several fishermen go fishing in the same lake, and each of them chooses one of several spots at which to fish. (It is possible for more than one fisherman to choose the same spot.)</p><p>In how many different ways can the fishermen choose their spots, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OSS", 25, "types of wine", "courses in the meal", "type of wine", "course",
            "<p>A gourmet chef is preparing a fancy several-course meal. There are several types of wine available, and the chef needs to choose one wine to serve with each course. (It is possible for the same wine to be served with more than one course.)</p><p>In how many different ways can the wines be chosen, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OAPpl", 26, "sons", "houses", "son", "house",
            "<p>A wealthy old woman is writing her will. She owns several houses, and wishes to leave each house to one of her sons. (It is possible for her to leave more than one house to the same son.)</p><p>In how many different ways can she write this part of her will, if there are {0} {1} and {2} {3}?</p>" ),
        // test set 2
        new Question( "OAPlc", 27, "crops", "fields", "crop", "field",
            "<p>A farmer is planning what crops he will plant this year. He chooses one crop for each of several fields. (It is possible for multiple fields to receive the same crop.)</p><p>In how many different ways can the farmer plant his crops, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "CAE", 28, "categories", "weather events", "category", "event", 
            "<p>A meteorologist must write a report classifying each extreme weather event which occurred in the past year into a category such as Hurricane, Tropical Storm, etc.</p><p>In how many different ways can he write his report, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OAPpl", 29, "children", "provinces", "child", "province",
            "<p>An aging king plans to divide his lands among his heirs. Each province of the kingdom will be assigned to one of his many children. (It is possible for multiple provinces to be assigned to the same child.)</p><p>In how many different ways can the provinces be assigned, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "PCO", 30, "treatments", "doctors", "treatment", "doctor",
            "<p>There are several possible treatments for a certain rare disease. A patient with this disease consults several doctors, and each doctor recommends one of the possible treatments. (It is possible for more than one doctor to recommend the same treatment.)</p><p>In how many different ways can the doctors make their recommendations, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OSS", 31, "colognes to choose from", "dates", "cologne", "date", 
            "<p>Don Juan has one date with each of a merchant's daughters. For each date, he puts on a cologne he thinks that daughter will like. (It is possible for him to choose the same cologne for more than one date.)</p><p>In how many different ways can he choose colognes for his dates, if there are {0} {1} and {2} {3}?</p>" ),
        new Question( "OAPpl", 32, "detectives", "cases", "detective", "case", 
            "<p>A police department receives several new cases in one day. Each new case is assigned to one of the detectives. (It is possible for multiple cases to be assigned to the same detective.)</p><p>In how many different ways can the cases be assigned, if there are {0} {1} and {2} {3}?</p>" )
        // starting from here are new questions not included in Exp 6
        ];
    
    return questions;

}


//////////////////////////////////
// Non-experiment Content
//////////////////////////////////

var entrance_turk   = '\
    <p>Thank you for your interest in our survey.</p> \
    <p>In this task you will:</p> \
    <ol> \
        <li>Read a consent form and give your consent to participate in this study.</li> \
        <li>Complete a survey in which you will learn some math and solve some problems. No advanced math is required.</li> \
        <li>Answer a few background questions about yourself.</li> \
    </ol> \
    <p>Payment for the task is performance-based:</p> \
    <ol> \
        <li>Base payment is $0.50 (you get this regardless of performance).</li> \
        <li>You get a bonus payment for each question you answer correctly above the minimum which you could get by just guessing.</li> \
        <li>The maximum payment including bonus (if you get all the questions correct) is $1.30.</li> \
        <li>90 minutes is allowed but 30 minutes is often enough time.</li> \
    </ol> \
    <p><b>PLEASE DO NOT ACCEPT THIS HIT</b> if you have completed another HIT with the name "Learn Some Math!" for this requester (Percepts Concepts). If you have, you will not be able to complete the HIT.</p> \
    <p><b>DO NOT USE THE FORWARD, BACKWARD, OR REFRESH BUTTONS</b> on your browser while working on the HIT - if you do, all your work will be lost. Also, please make sure your browser has Javascript enabled - otherwise, the HIT will not work.</p> ';
    
var entrance_nonturk    = '\
    <p>Thank you for participating in this study about mathematics learning!</p> \
    <p><b>DO NOT USE THE FORWARD, BACKWARD, OR REFRESH BUTTONS</b> on your browser while working on this study - if you do, all your work will be lost.</p> \
    <p>Click the button below when you are ready to begin.</p>';

var nextpage_button = '<p><input id="nextPageButton" type="button" name="nextPageButton"></p> ';
entrance_turk    += nextpage_button;
entrance_nonturk += nextpage_button;

var consent_form = '\
<p style="text-align: center;">\
 <strong>INDIANA UNIVERSITY INFORMED CONSENT STATEMENT</strong></p>\
<p style="text-align: center;">\
 <strong>Learning About Science</strong></p>\
<p style="text-align: center;">\
 <span style="font-size:11px;">IRB Study #0801000097 (05-9550)</span></p>\
<p style="text-align: center;">\
 <span style="font-size:11px;">Form date: December 28, 2012</span></p>\
<p style="text-align: center;">\
 <span style="font-size:11px;"><strong>IRB Approval Date: </strong>Jan 4, 2013</span></p>\
<p style="text-align: center;">\
 <span style="font-size:11px;"><strong>Expiration Date: </strong>Jan 3, 2015</span></p>\
<p>\
 You are invited to participate in a research study of how people learn scientific principles. You were selected as a possible subject because you indicated that you wished to participate on this website. We ask that you read this form and ask any questions you may have before agreeing to be in the study.</p>\
<p>\
 The study is being conducted by Dr. Robert Goldstone in the Department of Psychological and Brain Sciences.</p>\
<p>\
 <strong>STUDY PURPOSE: </strong>Science education is vital for developing general critical thinking skills and preparation for a wide variety of careers. However, many students have great difficulty acquiring scientific knowledge, and have particular difficulty applying their knowledge to new cases. The purpose of this study is to better understand how people acquire scientific knowledge and use it in new situations.</p>\
<p>\
 <strong>NUMBER OF PEOPLE TAKING PART IN THE STUDY: </strong>If you agree to participate, you will be one of approximately 6,000 subjects who will be participating in this research.</p>\
<p>\
 <strong>PROCEDURES FOR THE STUDY: </strong>If you agree to be in the study, you will be presented with several straightforward tasks to complete. These tasks will include interacting with graphical simulations of physical systems, and reading and entering text information. Each task will be related to a meaningful scientific principle. The entire session should take approximately 55 minutes.  You may only participate in the experiment once.</p>\
<p>\
 <strong>RISKS OF TAKING PART IN THE STUDY: </strong>There is the risk of loss of confidentiality.</p>\
<p>\
 <strong>BENEFITS OF TAKING PART IN THE STUDY: </strong>An understanding of how individuals learn scientific principles can help us understand human learning, memory, and reasoning, and help educators to convey scientific information more effectively. You benefit from this experience because you learn something about how an experiment is designed and conducted, what issues are of interest to cognitive scientists, and how the mind acquires and uses scientific knowledge.</p>\
<p>\
 <strong>ALTERNATIVES TO TAKING PART IN THE STUDY: </strong>Instead of being in the study, you have these options: Not being in the study.</p>\
<p>\
 <strong>CONFIDENTIALITY</strong>: Efforts will be made to keep your personal information confidential. We cannot guarantee absolute confidentiality. Your personal information may be disclosed if required by law. Your identity will be held in confidence in reports in which the study may be published and in databases in which results may be stored.</p><p>Organizations that may inspect and/or copy your research records for quality assurance and data analysis include groups such as the study investigator and his/her research associates, the IU Institutional Review Board or its designees, and (as allowed by law) state or federal agencies, specifically the Office for Human Research Protections (OHRP).</p>\
<p>\
 <strong>PAYMENT: </strong>For participating in this study, you will receive a small payment of $0.50.<br></p>\
<p>\
 <strong>CONTACTS FOR QUESTIONS OR PROBLEMS: </strong>For questions about the study or a research-related injury, contact the researcher Dr. Robert Goldstone at 812-855-4853, or rgoldsto@indiana.edu.</p>\
<p>\
 For questions about your rights as a research participant or to discuss problems, complaints or concerns about a research study, or to obtain information, or offer input, contact the IU Human Subjects office at (812) 856-4242 or by email at irb@iu.edu.</p>\
<p>\
 <strong>VOLUNTARY NATURE OF STUDY: </strong>Taking part in this study is voluntary. You may choose not to take part or may leave the study at any time. Leaving the study will not result in any penalty or loss of benefits to which you are entitled. Your decision whether or not to participate in this study will not affect your current or future relations with the investigator(s).</p>\
<p>\
 <strong>SUBJECT\'S CONSENT </strong></p>\
<p>\
 By checking below, you acknowledge that you have read and understood the above information, and give your consent to participate in our internet-based study.</p>\
<p><input id="consentBox" name="consentBox" type="checkbox" value="consentGiven">I Agree to take part in this study.</p>\
<p>Print this page before you click the box above to begin the experiment.</p>';
consent_form += nextpage_button;

var debriefing  = '<p>The experiment in which you just participated explores the effectiveness of different methods of learning and teaching mathematics. A critical issue in mathematics education is how to promote "transfer," i.e. applying what one has learned to novel situations outside the classroom.</p>\
<p>In principle, mathematical ideas are applicable to a wide range of problems in a variety of fields, making transfer particularly desirable. In practice, however, superficial differences between studied problems and newly encountered problems may conceal their shared mathematical structure, thus inhibiting transfer. A possible method of avoiding this difficulty would be to systematically vary the superficial characteristics of studied problems, while keeping their mathematical structure constant. Hopefully, this approach would encourage learners to focus on mathematical structure rather than superficial characteristics, thus leading to more transfer.</p>\
<p>This experiment involved various combinatorics problems. All shared the same mathematical structure: that of a Sampling with Replacement problem. You received instruction in how to solve such problems, in the form of a series of worked examples. In these examples, some types of things, such as locations, either "switched roles" between different examples, or always played the same roles throughout. You were then tested on problems involving several new types of situation. We hypothesize that the "switched roles" examples will lead to better test performance than the "constant roles" examples.</p>\
<p>Mathematics education in the USA is famously in need of reform. Inability to transfer knowledge learned to new problems is among the key issues to be resolved. We hope that our research will contribute to this reform by clarifying how the type of examples used to illustrate mathematical principles can affect the likelihood of successful knowledge transfer.</p>\
<p>We greatly appreciate your help in this research, which would not be possible without your effort. If you have any questions, or would like a more complete debriefing, please contact David Braithwaite at dwbraith@indiana.edu.</p>';

var exit_turk   = '\
    <p>You have now completed the study. Thank you very much for your participation!</p> \
    <p><b>Your HIT has NOT yet been submitted.</b> To submit the HIT, click the button at the bottom of this page.</p> \
    <p>The following paragraphs explain the background and purpose of this study. You may read them or skip them as you please.</p>';
exit_turk       += debriefing;
exit_turk       += '<form id="exit_form" method="POST">\
                    <input type="hidden" id="assignmentId" name="assignmentId" value="">\
                    <input id="mTurkSubmitButton" type="submit" name="Submit" value="Submit">\
                    </form>';

var exit_nonturk = '\
    <p>You have now completed the study. Thank you very much for your participation!</p>\
    <p>The following paragraphs explain the background and purpose of this study. You are not required to read them if you do not want to.</p>';
exit_nonturk    += debriefing;