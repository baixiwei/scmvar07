<?php

// connect to the database and create table if it doesn't exist
include('database_connect.php');
$table          = $_POST['table'];
createTable( $table );

// get subject id and condition assigned to current subject
$subjid         = $_POST['subjid'];
$condition      = $_POST['condition'];

// first generate subcondition, which guarantees that certain parameters are balanced within each condition
// create array to hold # complete per condition
$numsubcond     = 8;
$current_numbers = array_fill( 0, $numsubcond-1, 0 );

// query database to get actual number complete per subcondition within given condition
$query      = 'SELECT `subcondition`, COUNT(DISTINCT subjid) FROM '.mysql_real_escape_string($table).' WHERE `condition`='.$condition.' GROUP BY `subcondition`';
$result     = mysql_query($query);
while ( $row = mysql_fetch_array($result) ) {
	$current_numbers[intval($row['subcondition'])] = intval($row['COUNT(DISTINCT subjid)']);
}

// calculate probability of assignment for each subcondition
$probabilities  = array();
$min_curr_num   = min( $current_numbers );
$num_contenders = 0;
for ( $i=0; $i<$numsubcond; $i++ ) {
    if ( $current_numbers[$i] == $min_curr_num ) {
        $probabilities[$i] = 1.0;
        $num_contenders += 1;
    } else {
        $probabilities[$i] = 0.0;
    }
}
for ( $i=0; $i<$numsubcond; $i++ ) {
	$probabilities[$i] = $probabilities[$i] / $num_contenders;
}

// randomly assign subcondition based on calculated probabilities
$rand_val = mt_rand() / mt_getrandmax();
$final_subcondition = "";
for ( $i=0; $i<$numsubcond; $i++ ) {
	if($rand_val <= $probabilities[$i]) {
		$final_subcondition = $i;
		break;
	} else {
        $rand_val = $rand_val - $probabilities[$i];
    }
}
// $final_subcondition = rand(0,7);

// set subcondition and associated parameters determined by it
$subcondition       = $final_subcondition;
$question_orders    = array(0,0,0,0,1,1,1,1);
$term_consistencies = array(0,0,1,1,0,0,1,1);
$answer_orders      = array(0,1,0,1,0,1,0,1);
$question_order     = $question_orders[$subcondition];
$term_consistency   = $term_consistencies[$subcondition];
$answer_order       = $answer_orders[$subcondition];

// determine order of terms in q1 and q2: q1 randomly, q2 then determined by term_consistency
$q1_term_order      = rand(0,1);
$q2_term_order      = ( 1 + $term_consistency + $q1_term_order ) % 2;   // thus, term_consistency 1 is consistent and 0 is inconsistent

// determine numbers to instantiate q1 and q2 randomly

// generate_numbers returns 2 integers in [3,9] that are different from each other and those returned on previous call
// it is used to generate numbers that will instantiate questions during trials
function rand_exclude( $min, $max, $exc ) {
    do {
        $result = rand( $min, $max );
    } while( in_array( $result, $exc ) );
    return $result;
}
$prev_numbers   = array( 0, 0 );
function generate_numbers() {
    global $prev_numbers;
    $new_numbers = array_fill( 0, 1, 0 );
    $exclude = $prev_numbers;
    $new_numbers[0] = rand_exclude( 3, 9, $exclude );
    array_push( $exclude, $new_numbers[0] );
    $new_numbers[1] = rand_exclude( 3, 9, $exclude );
    $prev_numbers = $new_numbers;
    return $new_numbers;
}

// parameters randomly generated for each trial
$numbers        = generate_numbers();
$q1_base_num    = $numbers[0];
$q1_exp_num     = $numbers[1];
$numbers        = generate_numbers();
$q2_base_num    = $numbers[0];
$q2_exp_num     = $numbers[1];

// create params array
$params = array(
    "subcondition"      => $subcondition,
    "question_order"    => $question_order,
    "term_consistency"  => $term_consistency,
    "answer_order"      => $answer_order,
    "q1_term_order"     => $q1_term_order,
    "q1_base_num"       => $q1_base_num,
    "q1_exp_num"        => $q1_exp_num,
    "q2_term_order"     => $q2_term_order,
    "q2_base_num"       => $q2_base_num,
    "q2_exp_num"        => $q2_exp_num,
    );
    
// display the array (testing only)
// foreach ( $params as $key => $value ) {
    // echo "key: " . $key . "; value: " . $value . "<br>";
// }

// return to sender
echo json_encode( $params );

// and should save to database!
/*
// record condition and subcondition assignment to database
$subjid = $_POST['subjid'];
$query  = 'INSERT INTO '.mysql_real_escape_string($table).' (subjid,`condition`,`subcondition`) VALUES ("'.mysql_real_escape_string($subjid).'", "'.mysql_real_escape_string($condition).'", "'.mysql_real_escape_string($final_subcondition).'")';
$result = mysql_query($query);
*/
  
?>