<?php

// weightedSelect chooses an index randomly according to a vector of weights, which need not sum to 1
function weightedSelect( $weights ) {
    $tot = array_sum( $weights );
    $r = lcg_value() * $tot;
    $n = count( $weights );
    for ( $i=0; $i<$n; $i++ ) {
        if ( $r<=$weights[$i] ) {
            return $i;
        } else {
            $r = $r-$weights[$i];
        }
    }
}

// name of data table, number of conditions and subconditions, and subject ID should be passed in by ajax call
// $table      = $_POST['table'];
// $numcond    = $_POST['numcond'];
// $numsubcond = $_POST['numsubcond'];
// $subjid     = $_POST['subjid'];
$table      = 'scmvar_07_turk_testing';
$numcond    = 2556;
$numsubcond = 8;
$subjid     = 'A2E10V6PYGI0ZM';

// connect to the database and create table if it doesn't exist
include('database_connect.php');
createTable( $table );

// create arrays to hold # complete per condition total and for this participant
$completes_condition_total = array_fill( 0, $numcond, 0 );
$completes_condition_subj  = array_fill( 0, $numcond, 0 );

// query database to get actual number complete per condition
$query      = 'SELECT `condition`, COUNT(DISTINCT subjid) FROM '.mysql_real_escape_string($table).' GROUP BY `condition`';
$result     = mysql_query($query);
while ( $row = mysql_fetch_array($result) ) {
	$completes_condition_total[intval($row['condition'])] = intval($row['COUNT(DISTINCT subjid)']);
}

// calculate weight for each condition as (max completes)-(completes for this condition)
$weights_condition = array();
$max_completes = max( $completes_condition_total );
for ( $i=0; $i<$numcond; $i++ ) {
    $weights_condition[$i] = $max_completes - $completes_condition_total[$i];
}

// query database to get number complete per condition for THIS subject
$query      = 'SELECT `condition`, COUNT(DISTINCT subjid) FROM '.mysql_real_escape_string($table).' WHERE `subjid`="'. $subjid . '" GROUP BY `condition`';
$result     = mysql_query( $query );
while ( $row = mysql_fetch_array($result) ) {
    $completes_condition_subj[intval($row['condition'])] = intval($row['COUNT(DISTINCT subjid)']);
}

// change weight to 0 for any condition already completed by this subject
for ( $i=0; $i<$numcond; $i++ ) {
    if ( $completes_condition_subj[$i] > 0 ) {
        $weights_condition[$i] = 0;
    }
}

echo weightedSelect( $weights_condition );

// XXX done to here

/*

// calculate probabilities for each condition as normalized exp(2*weight)
$probabilities  = array();
$min_curr_num   = min( $completes_condition_total );
$num_contenders = 0;
for ( $i=0; $i<$numcond; $i++ ) {
    if ( $completes_condition_total[$i] == $min_curr_num ) {
        $probabilities[$i] = 1.0;
        $num_contenders += 1;
    } else {
        $probabilities[$i] = 0.0;
    }
}
for ( $i=0; $i<$numcond; $i++ ) {
	$probabilities[$i] = $probabilities[$i] / $num_contenders;
}

// testing only:
// for ( $i=0; $i<$numcond; $i++ ) {
   // echo 'condition: '. $i .'; total: '. $completes_condition_total[$i] .'; subj: '. $completes_condition_subj[$i] .'; weight: '. $weights_condition[$i] .'<br>';
// }

// change to the new probability weighting scheme!
// TBD.

// change probs to 0 for conditions already completed by this subject!
// TBD.

// randomly assign condition based on calculated probabilities
$rand_val = mt_rand() / mt_getrandmax();
$condition = "";
for ( $i=0; $i<$numcond; $i++ ) {
	if($rand_val <= $probabilities[$i]) {
		$condition = $i;
		break;
	} else {
        $rand_val = $rand_val - $probabilities[$i];
    }
}

// create array to hold # complete per subcondition
$current_numbers = array_fill( 0, $numsubcond, 0 );

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
$subcondition = "";
for ( $i=0; $i<$numsubcond; $i++ ) {
	if($rand_val <= $probabilities[$i]) {
		$subcondition = $i;
		break;
	} else {
        $rand_val = $rand_val - $probabilities[$i];
    }
}

// $cond_params                    = array();
// $cond_params['condition']       = $condition;
// $cond_params['subcondition']    = $subcondition;
// echo json_encode( $cond_params );
*/

?>