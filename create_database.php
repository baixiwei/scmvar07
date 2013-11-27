<?php

// connect to database dbraithwaite
include('database_connect.php');

// create the table if needed
$table = 'scmvar_07b_turk';
createTable( $table );

$old_table = 'scmvar_07_turk';

// copy data from the database from the pilot experiment, excluding undesired subjects
$add_data = mysql_query(
    'INSERT INTO `'.$table.'`
    SELECT `id`, `subjid`, `turk`, `sandbox`, `hitId`, `assignmentId`, `workerId`, `start_time`, `end_time`, NULL, NULL, 1, `condition`, `subcondition`, `question_order`, `answer_order`, `term_consistency`, `q1_quesID`, `q1_schema`, `q1_base_noun`, `q1_exp_noun`, `q1_base_num`, `q1_exp_num`, `q1_term_order`, `q2_quesID`, `q2_schema`, `q2_base_noun`, `q2_exp_noun`, `q2_base_num`, `q2_exp_num`, `q2_term_order`, `key`, `response`, `accuracy`, `rt`
    FROM `'. $old_table .'`
    WHERE (`subjid`<>"A183KTIUJIS9X8") & (`subjid`<>"A1YBWLRCOZY4FV") & (`subjid`<>"A2806UPBR5FJJ2") & (`subjid`<>"A2X5IFLMZJ4WGR") & (`subjid`<>"A3599RP5LTPAGH") & (`subjid`<>"A3GH7IV4Q9SBSB") & (`subjid`<>"A3IYDY7TO808Z3") & (`subjid`<>"A3JLLYFBSJ6676") & (`subjid`<>"A3SQUS8GXNTCSU") & (`subjid`<>"A952OD3EKPGB3") & (`subjid`<>"ANSGURJSWUO5H") & (`subjid`<>"AWNGOAO24ARJY") & (`subjid`<>"AZE084MMZVEYT") & (`subjid`<>"A2Y3DIYBUENKM5") ' );

// list of subjids to exclude was generated by toDelete.R in the folder \1.51 final used for pilot after completion\data    

if ( $add_data ) {
    echo "Success";
} else {
    echo mysql_error();
}

?>