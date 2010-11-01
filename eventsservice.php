<?php

#####
# This service outputs (in json) a list of events for a user, jid, that 
# occured between the provided start and end times.
#####

if (!empty($_GET['start']) && !empty($_GET['end']) && !empty($_GET['jid'])) {

	try {
		# TODO: Move this connection info to a config file
		$dbh = new PDO("mysql:host=localhost;dbname=talkstalk", "root",
		 			   "password");
		$dbh->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
	}
	catch (PDOException $e)
	{
	 	print 'Unable to connect to database ' . $e->getMessage();
	}

	$statement = 'select id, jid, start, end, duration, show_message, other
				  from event where start between :start and :end
				  and end between :start and :end and jid=:jid';

	$preparedStmt = $dbh->prepare($statement);

	$preparedStmt->bindValue(':start', $_GET['start'], PDO::PARAM_STR);
	$preparedStmt->bindValue(':end', $_GET['end'], PDO::PARAM_STR);
	$preparedStmt->bindValue(':jid', $_GET['jid'], PDO::PARAM_STR);
	$preparedStmt->execute();
	$thisResult = $preparedStmt->fetchAll(PDO::FETCH_ASSOC);
	$preparedStmt->closeCursor();

	$total_duration = 0;

	foreach ($thisResult as $result) {
		$total_duration += $result['duration'];
	}
	
	$events = array();

	foreach ($thisResult as $result) {
		$event = array('id'=>$result['id'],
					   'start'=>date('r', strtotime($result['start'])),
					   'end'=>date('r', strtotime($result['end'])),
					   'duration'=>$result['duration'],
					   'message'=>$result['show_message'],
					   'other'=>$result['other']);
	
		$events[] = $event;
	}
	
	$toEncode = array('jid'=>$result['jid'],
					  'total_duration'=> $total_duration,
					  'events'=>$events);
	echo json_encode($toEncode);
} else {
	header("HTTP/1.1 400 Bad Request");
}
?>