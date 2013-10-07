<?php

// Revised version of assign_condition.php
// Picks a sub-condition at random from among those with the minimum number of Ss so far assigned to a given condition

// Sample usage in javascript:
//
/* 

// Use jQuery ajax call to invoke php script
// Set path to this script in url argument
// data argument needs following parameters:
// 		"table": name of table in mysql database that has experiment data
//          "table" must have columns "subjid", "condition", and "subcondition"
//      "subjid": id of current subject
//      "condition": condition of current subject
// 		"numsubcond": number of subconditions
// When the ajax call is complete, data will be a string = to the randomly chosen subcondition number
$.ajax({
	type: 'post',
	cache: false,
	url: 'assign_subcondition.php',
	data: {"table": table, "subjid": subjid, "condition": condition, "numsubcond": numsubcond},
	success: function(data) { console.log(data); }
});

*/

// connect to the database and create table if it doesn't exist
include('database_connect.php');
$table          = $_POST['table'];
createTable( $table );

// get condition assigned to current subject
$condition      = $_POST['condition'];

// get number of sub-conditions and create array to hold # complete per condition
$numsubcond     = $_POST['numsubcond'];
$current_numbers = array();
for ( $i=0; $i<$numsubcond; $i++ ) {
        $current_numbers[$i] = 0;
}

// query database to get actual number complete per subcondition
$query      = 'SELECT `subcondition`, COUNT(DISTINCT subjid) FROM '.mysql_real_escape_string($table).' WHERE `condition`='.$condition.' GROUP BY `subcondition`';
$result     = mysql_query($query);
while ( $row = mysql_fetch_array($result) ) {
	$current_numbers[intval($row['subcondition'])] = intval($row['COUNT(DISTINCT subjid)']);
}

// calculate probability of assignment for each condition
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

// record condition and subcondition assignment to database
$subjid = $_POST['subjid'];
$query  = 'INSERT INTO '.mysql_real_escape_string($table).' (subjid,`condition`,`subcondition`) VALUES ("'.mysql_real_escape_string($subjid).'", "'.mysql_real_escape_string($condition).'", "'.mysql_real_escape_string($final_subcondition).'")';
$result = mysql_query($query);

// return condition assignment
echo $final_subcondition;

?>