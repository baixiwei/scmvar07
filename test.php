<?php

// global variables
/*
$table          = $_POST['table'];
$subjid         = $_POST['subjid'];
$numcond        = $_POST['numcond'];
$numsubcond     = $_POST['numsubcond'];
$trialspersubj  = $_POST['trialspersubj'];
*/

$table          = "scmvar_07b_testing";
$subjid         = "subj_165365789324670";
$numcond        = 2556;
$numsubcond     = 8;
$trialspersubj  = 10;

// connect to the database and create table if it doesn't exist
include('database_connect.php');
createTable( $table );

// assignCondSubcondArray assigns $trialspersubj condition/subcondition pairs to a subject
function assignCondSubcondArray( $subjid ) {

    global $trialspersubj;

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

// assignCondSubcond assigns a condition and subcondition to a given subject
// conditions are assigned from among those not done by the subject
// (IMPORTANT! must guarantee that $trialspersubj <= the number of conditions not done by the subject)
// using exponentially-scaled distance from maximum total completes as probability weights
// subconditions are assigned deterministically from among those with minimum completes for the selected condition
function assignCondSubcond( $subjid ) {

    // get weights for random selection of condition
    $weights_condition = getConditionWeights( $subjid );

    // select condition according to weights
    $condition = weightedSelect( $weights_condition );

    // get weights for subconditions within given condition
    $weights_subcondition = getSubconditionWeights( $condition );
    
    // select subcondition according to (unscaled) weights
    $subcondition = weightedSelect( $weights_subcondition );

    // return condition and subcondition
    $cond_subcond                   = array();
    $cond_subcond['condition']      = $condition;
    $cond_subcond['subcondition']   = $subcondition;
    return $cond_subcond;
    
}

// assign probability weights to the various conditions
function getConditionWeights( $subjid ) {
    
    // calculate weight for each condition as (max completes)-(completes for this condition)
    $completes_total    = getCompletesTotal();
    $weights_condition  = array();
    $max_completes      = max( $completes_total );
    for ( $i=0; $i<count($completes_total); $i++ ) {
        $weights_condition[$i] = $max_completes - $completes_total[$i];
    }
    
    // exponentially scale weights
    $scaled_weights_condition = scaleWeights( $weights_condition );

    // change weight to 0 for any condition already completed by this subject
    $completes_subj     = getCompletesSubj( $subjid );
    for ( $i=0; $i<count($completes_subj); $i++ ) {
        if ( $completes_subj[$i] > 0 ) {
            $scaled_weights_condition[$i] = 0;
        }
    }
    
    // return resulting weights
    return $scaled_weights_condition;
    
}

// assign probability weights to the various subconditions of a selected condition
function getSubconditionWeights( $condition ) {

    // calculate weight for each subcondition
    // as 1 if it is among the subconditions with the fewest completes under the given condition,
    // and as 0 otherwise
    $completes_subcond      = getCompletesSubcond( $condition );
    $weights_subcond        = array();
    $min_completes_subcond  = min( $completes_subcond );
    for ( $i=0; $i<count($completes_subcond); $i++ ) {
        if ( $completes_subcond[$i]==$min_completes_subcond ) {
            $weights_subcond[$i] = 1;
        } else {
            $weights_subcond[$i] = 0;
        }
    }

    // return resulting weights
    return $weights_subcond;
    
}

// retrieve the total number of completes for each condition from the database
function getCompletesTotal() {

    global $table, $numcond;
    
    // create array to hold # complete per condition
    $completes_condition_total = array_fill( 0, $numcond, 0 );
    
    // query database to get actual number complete per condition
    $query      = 'SELECT `condition`, COUNT(DISTINCT id) FROM '.mysql_real_escape_string($table).' WHERE `approve`=1 GROUP BY `condition`';
    $result     = mysql_query($query);
    while ( $row = mysql_fetch_array($result) ) {
        $completes_condition_total[intval($row['condition'])] = intval($row['COUNT(DISTINCT id)']);
    }
    
    // return the result
    return $completes_condition_total;
    
}

// retrieve the total number of completes for each condition for a given subject from the database
function getCompletesSubj( $subjid ) {

    global $table, $numcond;

    // create array to hold # complete per condition for this subject
    $completes_condition_subj  = array_fill( 0, $numcond, 0 );
    
    // query database to get number complete per condition for this subject
    $query      = 'SELECT `condition`, COUNT(DISTINCT id) FROM '.mysql_real_escape_string($table).' WHERE (`subjid`="'. $subjid . '") GROUP BY `condition`';
    $result     = mysql_query( $query );
    while ( $row = mysql_fetch_array($result) ) {
        $completes_condition_subj[intval($row['condition'])] = intval($row['COUNT(DISTINCT id)']);
    }
    
    // return the result
    return $completes_condition_subj;
    
}

// retrieve the total number of completes for each subcondition under a given condition from the database
function getCompletesSubcond( $condition ) {

    global $table, $numsubcond;
    
    // create array to hold # complete per subcondition within given condition
    $completes_subcond = array_fill( 0, $numsubcond, 0 );

    // query database to get actual number complete per subcondition within given condition
    $query      = 'SELECT `subcondition`, COUNT(DISTINCT subjid) FROM '.mysql_real_escape_string($table).' WHERE `condition`='.$condition.' GROUP BY `subcondition`';
    $result     = mysql_query($query);
    while ( $row = mysql_fetch_array($result) ) {
        $completes_subcond[intval($row['subcondition'])] = intval($row['COUNT(DISTINCT subjid)']);
    }

    // return the result
    return $completes_subcond;
    
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

// weightedSelect chooses an index randomly according to a vector of weights, which need not sum to 1
function weightedSelect( $weights ) {
    $tot = array_sum( $weights );
    $r = lcg_value() * $tot;
    $n = count( $weights );
    do {
        for ( $i=0; $i<$n; $i++ ) {
            if ( $r<=$weights[$i] ) {
                $result = $i;
                break;
            } else {
                $r = $r-$weights[$i];
            }
        }
    } while( $weights[ $result ] == 0 );
    return $result;
}

// $result = getCompletesTotal();
// $result = getCompletesSubj( $subjid );
 $result = getConditionWeights( $subjid );
// $result = getCompletesSubcond( 1447 );
// $result = getSubconditionWeights( 1447 );

// $completed  = getCompletesSubj( $subjid );
// echo "Starting. Completes length: " . count($completed) . "<br>";
// $weights    = getConditionWeights( $subjid );
// $result     = "";
// for ( $i=0; $i<1000; $i++ ) {
    // $cond_subcond_array = assignCondSubcondArray( $subjid );
    // for ( $j=0; $j<count($cond_subcond_array); $j++ ) {
        // $cond = $cond_subcond_array[$j]['condition'];
        // if ( $completed[$cond]>0 ) {
            // // $result = $result . "Illegal assignment. Condition: " . $cond . "; Weight: " . $weights[$cond] . ".<br>";
            // // echo "Illegal assignment. Condition: " . $cond . "; Weight: " . $weights[$cond] . ".<br>";
            // echo "<br>Illegal assignment. Condition: " . $cond . "; Completed: " . $completed[$cond] . "; Weight: " . $weights[$cond] . "<br>";
        // } else {
            // echo "-";
        // }
    // }
// }

print "<pre>";
print_r( $result );
print "</pre>";
print "<p>Done.</p>";


/*
$cond_subcond_array = assignCondSubcondArray( $subjid );

echo json_encode( $cond_subcond_array );
*/
?>