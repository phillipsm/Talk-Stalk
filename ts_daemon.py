import xmpp
import MySQLdb
import datetime
import sys

#####
# This script acts is our daemon that connects to our XMPP server
# and logs XMPP roster (buddy list) activity to our DB
#####


# handler is called when our XMPP server detects a new event
# handler processes new event. If the new event book ends a previously seen
# event, we pair them up and write then persist them. If the new event doesn't
# have a bookend (a start to its end), add it to our partial events list
def handler(con, new_event):    
    jid = new_event.getFrom().getStripped()
    show = new_event.getShow()
    other = new_event.getStatus()
        
    # if a user sets their status to invisible, its type is unavailble
    if new_event.getType() == 'unavailable':
        show = 'invisible'
        
    if show is None:
        show = 'available'
    
    for partial_event in partial_events:
        if (jid == partial_event["jid"]):
                
            # we have a pair, so create an event
            point = {"jid": partial_event["jid"],
                     "start": partial_event["start"],
                     "end": datetime.datetime.now().isoformat(),
                     "show": partial_event["show"],
                     "other": partial_event["other"]}
            partial_events.remove(partial_event)
            persist_event(point)
            break          
    
    new_partial_event = {"jid": jid,
                     "start": datetime.datetime.now().isoformat(),
                     "show": show, "other": other}

    partial_events.append(new_partial_event)

# when we have an event we want to persist, we call this funciton
# right now, the events are just written to a single MySQL DB tbale
def persist_event(point):
    # TODO: Move this connection info to a config file
    connection = MySQLdb.connect(host = "localhost", user = "root",
                                 passwd = "password", db = "talkstalk")

    cursor = connection.cursor()
    cursor.execute("""
        insert into event (jid, start, end, duration, show_message, other)
        values (%(jid)s, %(start)s, %(end)s, 
        (select timestampdiff(MINUTE, %(start)s, %(end)s)),%(show)s, %(other)s);
        """, point)
    print "Number of rows inserted: %d" % cursor.rowcount
    connection.commit()	
    cursor.close()


# our global array of events that do no not have a book end
partial_events = [];

# Connect to our XMPP server
# TODO: Move this connection info to a config file
userID   = 'your instant messenger userid'
password = 'your instant messenger passowrd'
ressource = 'Script'

jid  = xmpp.protocol.JID(userID)
jabber = xmpp.Client(jid.getDomain(), debug=[])

connection = jabber.connect(('talk.google.com',5222))

if not connection:
    sys.stderr.write('Could not connect\n')
else:
    sys.stderr.write('Connected with %s\n' % connection)

auth = jabber.auth(jid.getNode(), password, ressource)
if not auth:
    sys.stderr.write("Could not authenticate\n")
else:
    sys.stderr.write('Authenticated using %s\n' % auth)


jabber.sendInitPresence(requestRoster=1)

# Register hour handler function as a callback
jabber.RegisterHandler('presence', handler)

# spin away looking for updates to our roster
while jabber.Process(1):
    pass