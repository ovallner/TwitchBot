from phue import Bridge
from get_pass import *
import socket
import os
import random
import re
import time
from threading import Thread

b = Bridge(get_bridge_ip())
b.connect()
b.get_api()

nickname = "MaellBot"
password = get_twitch_token()
channel = "maellic"
server = "irc.twitch.tv"
s = socket.socket()

moderators = ['maellic', 'MaellBot']

print("connecting to:"+server)
s.connect((server, 6667))
s.send(("PASS %s \r\n" % password).encode('utf-8'))
s.send(("NICK %s \r\n" % nickname).encode('utf-8'))
received = s.recv(1024).decode()
print(received)
s.send(("USER " + nickname + " 0 * " + nickname + '\r\n').encode('utf-8'))
s.send(("JOIN #%s \r\n" % channel).encode('utf-8'))
#s.send(("PRIVMSG #%s :I'm here!\r\n" % channel).encode('utf-8'))
print("Done!")

picker_colors = {
    0: "red",
    25500: "blue",
    46920: "green",
    12750: "yellow",
    56100: "purple",
    65280: "pink"
}


def picker(options, seconds):
    print("starting picker!")
    s.send(("PRIVMSG #" + channel + " :Staring a " + str(seconds) + " second Picker! In...\r\n").encode('utf-8'))
    time.sleep(1)
    s.send(("PRIVMSG #%s :3...\r\n" % channel).encode('utf-8'))
    time.sleep(1)
    s.send(("PRIVMSG #%s :2...\r\n" % channel).encode('utf-8'))
    time.sleep(1)
    s.send(("PRIVMSG #%s :1...\r\n" % channel).encode('utf-8'))
    time.sleep(1)
    s.send(("PRIVMSG #%s :Time Started!\r\n" % channel).encode('utf-8'))
    time.sleep(seconds)
    color = int(b.get_light("Floor Lamp", "hue"))
    print(color)
    if color in picker_colors:
        s.send(("PRIVMSG #" + channel + " :Winner is " + picker_colors[color] + "!!!!\r\n").encode('utf-8'))
    else:
        s.send(("PRIVMSG #" + channel + " :No Winner Found\r\n").encode('utf-8'))
    

def main():
    print("Hello World!")
    while True:
        data = s.recv(4096).decode()
        print(data)
        if data.find ( 'PING' ) != -1:
            s.send ( ('PONG ' + data.split() [ 1 ] + '\r\n').encode('utf-8') )

        if data.find( 'PRIVMSG' ) != -1:
            user = re.findall(r'^:([a-zA-Z0-9_]+)!', data)[0]
            message = re.findall(r'PRIVMSG #[a-zA-Z0-9_]+ :(.+)', data)[0]
            message = message[:-1]

            '''
            if user in moderators:
                if message[:5] == "!pick":
                    try:
                        print("Picking time!")
                        params = message[5:].split()
                        if len(params) != 2:
                            print("Wrong number of options!")
                            continue
                        options = int(params[0])
                        seconds = int(params[1])
                        thread = Thread(target = picker, args=(options, seconds))
                        thread.start()
                        if options > 6:
                            print("Too many options!")
                            continue
                        print("Option: ", options)
                        print("Seconds: ", seconds)
                    except Exception as e:
                        print(e)
                    

                print("Mod has chatted!")
            '''
            if message == "!red":
                b.set_group("Oscar's room", "hue", 65280)
                continue
            elif message == "!blue":
                print("Blue!")
                b.set_group("Oscar's room", "hue", 46920)
                continue
            elif message == "!green":
                b.set_group("Oscar's room", "hue", 25500)
                continue
            elif message == "!yellow":
                b.set_group("Oscar's room", "hue", 12750)
                continue
            elif message == "!purple":
                b.set_group("Oscar's room", "hue", 56100)
                continue   
            elif message == "!pink":
                b.set_group("Oscar's room", "hue", 65280)
                continue 
            elif message == "!random":
                b.set_group("Oscar's room", "hue", random.randrange(0, 65280))
                continue
            try:
                if message[:5] == "!hue ":
                    print(message[5:])
                    hue = int(message[5:])
                    if hue >= 0 and hue <=65280:
                        b.set_group("Oscar's room", "hue", hue)
                        continue
            except Exception as e:
                print(e)

            print(user + ": " + message)
        print(data)


if __name__ == "__main__":main()

