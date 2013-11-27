<?php

// name of data table, number of conditions and subconditions, and subject ID should be passed in by ajax call
$table          = 'scmvar_07_turk_testing';
$subjid         = 'subj_100074810';
$numcond        = 2556;
$numsubcond     = 8;
$trialspersubj  = 10;

// connect to the database and create table if it doesn't exist
include('database_connect.php');
createTable( $table );

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

// scaleWeights takes a vector of weights and returns an exponentially scaled version thereof
function scaleWeights( $weights ) {
    $scaledWeights = array();
    $n = count( $weights );
    for ( $i=0; $i<$n; $i++ ) {
        $scaledWeights[$i] = exp( 3*$weights[$i] );
    }
    return $scaledWeights;
}

/*
// create arrays to hold # complete per condition total and for this participant
$completes_condition_total = array_fill( 0, $numcond, 0 );
$completes_condition_subj  = array_fill( 0, $numcond, 0 );

// query database to get actual number complete per condition
$query      = 'SELECT `condition`, COUNT(DISTINCT id) FROM '.mysql_real_escape_string($table).' GROUP BY `condition`';
$result     = mysql_query($query);
while ( $row = mysql_fetch_array($result) ) {
    $completes_condition_total[intval($row['condition'])] = intval($row['COUNT(DISTINCT id)']);
}

// calculate weight for each condition as (max completes)-(completes for this condition)
$weights_condition = array();
$max_completes = max( $completes_condition_total );
for ( $i=0; $i<$numcond; $i++ ) {
    $weights_condition[$i] = $max_completes - $completes_condition_total[$i];
}

// exponentially scale weights
$scaled_weights_condition = scaleWeights( $weights_condition );

// query database to get number complete per condition for THIS subject
$query      = 'SELECT `condition`, COUNT(DISTINCT id) FROM '.mysql_real_escape_string($table).' WHERE `subjid`="'. $subjid . '" GROUP BY `condition`';
$result     = mysql_query( $query );
while ( $row = mysql_fetch_array($result) ) {
    $completes_condition_subj[intval($row['condition'])] = intval($row['COUNT(DISTINCT id)']);
}

// change weight to 0 for any condition already completed by this subject
for ( $i=0; $i<$numcond; $i++ ) {
    if ( $completes_condition_subj[$i] > 0 ) {
        $scaled_weights_condition[$i] = 0;
    }
}

// print number of completes per condition for this subject
print( "<pre>" );
print_r( $scaled_weights_condition );
print( "</pre>" );
*/

// assignCondSubcond assigns a condition and subcondition to a given subject
// conditions are assigned from among those not done by the subject
// (IMPORTANT! must guarantee that $trialspersubj <= the number of conditions not done by the subject)
// using exponentially-scaled distance from maximum total completes as probability weights
// subconditions are assigned deterministically from among those with minimum completes for the selected condition
function assignCondSubcond( $subjid ) {

    global $table, $numcond, $numsubcond;

    // create arrays to hold # complete per condition total and for this participant
    $completes_condition_total = array_fill( 0, $numcond, 0 );
    $completes_condition_subj  = array_fill( 0, $numcond, 0 );

    // query database to get actual number complete per condition
    $query      = 'SELECT `condition`, COUNT(DISTINCT id) FROM '.mysql_real_escape_string($table).' GROUP BY `condition`';
    $result     = mysql_query($query);
    while ( $row = mysql_fetch_array($result) ) {
        $completes_condition_total[intval($row['condition'])] = intval($row['COUNT(DISTINCT id)']);
    }

    // calculate weight for each condition as (max completes)-(completes for this condition)
    $weights_condition = array();
    $max_completes = max( $completes_condition_total );
    for ( $i=0; $i<$numcond; $i++ ) {
        $weights_condition[$i] = $max_completes - $completes_condition_total[$i];
    }

    // exponentially scale weights
    $scaled_weights_condition = scaleWeights( $weights_condition );

    // query database to get number complete per condition for THIS subject
    $query      = 'SELECT `condition`, COUNT(DISTINCT id) FROM '.mysql_real_escape_string($table).' WHERE `subjid`="'. $subjid . '" GROUP BY `condition`';
    $result     = mysql_query( $query );
    while ( $row = mysql_fetch_array($result) ) {
        $completes_condition_subj[intval($row['condition'])] = intval($row['COUNT(DISTINCT id)']);
    }

    // change weight to 0 for any condition already completed by this subject
    for ( $i=0; $i<$numcond; $i++ ) {
        if ( $completes_condition_subj[$i] > 0 ) {
            $scaled_weights_condition[$i] = 0;
        }
    }

    // select condition according to exponentially scaled weights
    $condition = weightedSelect( $scaled_weights_condition );

    // create array to hold # complete per subcondition within given condition
    $completes_subcond_total = array_fill( 0, $numsubcond, 0 );

    // query database to get actual number complete per subcondition within given condition
    $query      = 'SELECT `subcondition`, COUNT(DISTINCT subjid) FROM '.mysql_real_escape_string($table).' WHERE `condition`='.$condition.' GROUP BY `subcondition`';
    $result     = mysql_query($query);
    while ( $row = mysql_fetch_array($result) ) {
        $completes_subcond_total[intval($row['subcondition'])] = intval($row['COUNT(DISTINCT subjid)']);
    }

    // calculate weight for each subcondition as (max completes)-(completes for this subcondition)
    $weights_subcond = array();
    $min_completes_subcond = min( $completes_subcond_total );
    for ( $i=0; $i<$numsubcond; $i++ ) {
        if ( $completes_subcond_total[$i]==$min_completes_subcond ) {
            $weights_subcond[$i] = 1;
        } else {
            $weights_subcond[$i] = 0;
        }
    }

    // select subcondition according to (unscaled) weights
    $subcondition = weightedSelect( $weights_subcond );

    // return condition and subcondition
    $cond_subcond                   = array();
    $cond_subcond['condition']      = $condition;
    $cond_subcond['subcondition']   = $subcondition;
    return $cond_subcond;
}

// assignCondSubcondArray assigns $trialspersubj condition/subcondition pairs to a subject
function assignCondSubcondArray( $subjid ) {

    global $table, $trialspersubj;

    $conditions_assigned    = array();
    $cond_subcond_array     = array();
    for ( $i=0; $i<$trialspersubj; $i++ ) {
        do {
            $cond_subcond = assignCondSubcond( $subjid );
        } while( in_array( $cond_subcond['condition'], $conditions_assigned ) );
        $cond_subcond_array[$i]     = $cond_subcond;
        $conditions_assigned[$i]    = $cond_subcond['condition'];
    }

    return $cond_subcond_array;
}

// create arrays to hold # complete per condition total and for this participant
$completes_condition_subj  = array_fill( 0, $numcond, 0 );
$query      = 'SELECT `condition`, COUNT(DISTINCT id) FROM '.mysql_real_escape_string($table).' WHERE `subjid`="'. $subjid . '" GROUP BY `condition`';
$result     = mysql_query( $query );
while ( $row = mysql_fetch_array($result) ) {
    $completes_condition_subj[intval($row['condition'])] = intval($row['COUNT(DISTINCT id)']);
}

$cond_subcond = assignCondSubcond( $subjid );

$cond = $cond_subcond['condition'];

$return_arr = $cond_subcond;

$return_arr['completed'] = $completes_condition_subj[$cond];

echo json_encode( $return_arr );

/*

$cond_subcond_array = assignCondSubcondArray( $subjid );

echo json_encode( $cond_subcond_array );
*/
?>