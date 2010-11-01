<?php

#####
# This service outputs (in json) a list of users (aka jids)
# that can be used as targets (get event info on these users)
#####

#TODO: move this config info to a config file
try {
	$dbh = new PDO("mysql:host=localhost;dbname=talkstalk", "root", "password");
	$dbh->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
}
catch (PDOException $e)
{
 	print 'Could not connect to DB' . $e->getMessage();
}

$statement = 'select distinct jid from event';

$preparedStmt = $dbh->prepare($statement);

$preparedStmt->execute();
$thisResult = $preparedStmt->fetchAll(PDO::FETCH_COLUMN, 0);
$preparedStmt->closeCursor();

$toEncode = array('jids'=>$thisResult);
echo json_encode($toEncode);
?>