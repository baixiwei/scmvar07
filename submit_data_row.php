<?php
// revised from submit_data for submitting a single trial

// connect to database dbraithwaite
include('database_connect.php');

// set table name and create the table if needed
$table = $_POST['table'];
createTable( $table );

// receive data from experiment
$data_row = (array)json_decode($_POST['json']);

// insert data into database
function mysql_insert( $table, $inserts ) {
    $values = array_map('mysql_real_escape_string', array_values($inserts));
    $keys   = array_keys($inserts);
    return mysql_query('INSERT INTO `'.$table.'` (`'.implode('`,`', $keys).'`) VALUES (\''.implode('\',\'', $values).'\')');
}
$result = mysql_insert( $table, $data_row );

// confirm the results
if (!$result) {
	die('Invalid query: ' . mysql_error());
} else {
	print "successful insert!";
}

// export to csv
// $file   = 'data/'.$table.'_data.csv';
// unlink( $file );
// include 'mysql_to_csv.php';
// exportMysqlToCsv($table,$file);

?>