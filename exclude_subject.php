<?php

// get subject id and names of tables to be excluded from POST call
$subjid = $_POST['subjid'];
$tables = json_decode($_POST['tables'],true);

// connect to mysql database
include('database_connect.php');

// check whether the present subject is in any of the to be excluded tables
function subjid_exists($tables, $subjid) {
	for($i=0; $i < count($tables); $i++) {
  	$query = 'SELECT subjid FROM '.$tables[$i].' WHERE subjid="'.mysql_real_escape_string($subjid).'"';
		$result = mysql_query($query);
		if (mysql_num_rows($result) > 0) return true;
	}
	return false;
}

// return whether the subject should be excluded or not
if (subjid_exists($tables, $subjid)) echo 1;
else echo 0;

// // uncomment this part if you have multiple HITs but want to ensure a worker can only do one of them
// // add the subject's id to the current table so they can't do it again
// $table = $_POST['table'];
// createTable( $table );
// $query  = 'INSERT INTO '.mysql_real_escape_string($table).' ('.mysql_real_escape_string("subjid").') VALUES ("'.mysql_real_escape_string($subjid).'")';
// $result = mysql_query($query);

?>
