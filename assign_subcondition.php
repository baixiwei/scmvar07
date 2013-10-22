<?php

// connect to the database and create table if it doesn't exist
include('database_connect.php');
$table          = $_POST['table'];
createTable( $table );

// get subject id, condition assigned to current subject, and number of subconditions
$subjid         = $_POST['subjid'];
$condition      = $_POST['condition'];
$numsubcond     = $_POST['numsubcond'];

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
$final_subcondition = "";
for ( $i=0; $i<$numsubcond; $i++ ) {
	if($rand_val <= $probabilities[$i]) {
		$final_subcondition = $i;
		break;
	} else {
        $rand_val = $rand_val - $probabilities[$i];
    }
}

// return assigned subcondition
echo $final_subcondition;
  
?>