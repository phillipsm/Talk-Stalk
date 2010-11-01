$(document).ready(function() {
	//Build our datepickers
	var dates = $( "#from, #to" ).datepicker({
		defaultDate: "+1w",
		changeMonth: true,
		dateFormat: 'yy-mm-dd',
		numberOfMonths: 1,
		onSelect: function( selectedDate ) {
			var option = this.id == "from" ? "minDate" : "maxDate",
			instance = $( this ).data( "datepicker" );
			date = $.datepicker.parseDate(
				instance.settings.dateFormat ||
				$.datepicker._defaults.dateFormat,
				selectedDate, instance.settings );
				dates.not( this ).datepicker( "option", option, date );
		}
	});

	//Populate our drop down
	$.ajax({
		type: "GET",
		url: "usersservice.php",
		cache: false,
		dataType: "json",
		success: function(result) {
			var options = $("#options");
			$.each(result.jids, function(i, item) {
				options.append($("<option />").val(item).text(item));
			});
		},
		error: function(e, xhr) {
			console.log('error');
		}
	});

	//Bind our form's submit
	$('#target').submit(function() {
		show_contact();
		return false;
	});
});

//The heavly lifting happens here. 
function show_contact() {
	$.ajax({
		type: 'GET',
		url: 'eventsservice.php',
		data: 'jid=' +  $('#options').val() + '&start=' + 
			  $('#from').val() + '&end=' + $('#to').val(),
		cache: false,
		dataType: 'json',
		success: function(data) {
			if(data.events.length > 0) {

				var first_start = new Date(data.events[0].start);
				var last_end = new Date(data.events[data.events.length-1].end);
				var row = '<div class="single_row"><div>' + data.jid + '</div></div>';
				$('#row_container').append(row);
				var prev_end_time;

				var total_duration = last_end.getTime() - first_start.getTime();

				$.each(data.events, function(i,item) {
					var start_time = new Date(item.start);
					var end_time = new Date(item.end);
					var event_duration = end_time.getTime()-start_time.getTime();

					var chunk = '';

					if (prev_end_time && start_time.getTime() != prev_end_time.getTime()) {
						var missing_time = start_time.getTime() - prev_end_time.getTime();

						chunk = '<div class="missing_time" style="width:' + (missing_time/total_duration)*100 + '%;"><span>not signed in</span></div>';
					}

					chunk = chunk + '<div class="some_event" style="background-color:' + get_color(item.message) + '; width:' + (event_duration/total_duration)*100 +'%;" id=' + item.id + '><span>' + item.message + '</span></div>';
					$(".single_row:last").append(chunk);
					prev_end_time = end_time;
				})
			} else {

			}
		},
		error: function(e, xhr){
			console.log('error');
		}
	});
}

function get_color(status) {
	switch (status) {
		case 'away': return 'gray';
		case 'invisible': return 'pink';
		case 'dnd': return 'DarkGoldenRod';
		case 'xa': return 'purple';
		case 'available': return 'green';
		default: return 'orange';
	}		
}