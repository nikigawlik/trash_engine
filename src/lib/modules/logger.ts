

const baseURL = 'https://trashengine-telemetry-test.glitch.me';

interface LogEvent {
    message: string,
    data: any,
    timestamp: Date,
}

class Logger {
    events: LogEvent[];
    consoleLevel: "all" | "message" | "none"
    telemetryOn: boolean
    lastServerSend: LogEvent
    constructor(consoleLevel: typeof this.consoleLevel = "all", telemetryOn = false) {
        this.events = [];
        this.consoleLevel = consoleLevel;
        this.telemetryOn = telemetryOn;
        this.lastServerSend = null;
    }

    log(message: string, data: any) {
        this.events.push({
            message,
            data,
            timestamp: new Date(), // now
        });

        if(this.consoleLevel == "message")
            console.log(message)
        else if(this.consoleLevel == "all")
            console.log(message, data)

        const now = Date.now();
        const then = this.lastServerSend? Number(this.lastServerSend.timestamp) : 0;
        const delay = 1000; // ms
        if(this.telemetryOn && (now - then > delay) ) {
            let lastMsg = this.events.findIndex(x => x == this.lastServerSend);
            let data = []
            for(let i = lastMsg+1; i < this.events.length; i++) {
                data.push(this.events[i]);
            };
            this.lastServerSend = this.events[this.events.length - 1];
            // async !
            this.postToServerSafe(JSON.stringify(data)); 
        }
    }

    getTextLog(level: typeof this.consoleLevel) {
        const events = this.events.map(ev => 
            `${formatTimestamp(ev.timestamp)}; ${ev.message}`
            + (level == "all"? `; ${JSON.stringify(ev.data)}` : "")  // add json if level is all
        );
        const textData = events.join("\n");
        return textData;
    }

    async postToServer(message: string) {
        const url = `${baseURL}/log`;
  
        const body = {
          message,
        };
  
        // Use fetch to send a POST request
        let response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();
      
        console.log('Response from server:', data);
        return data as {status: string, message: string};
      }
  
    async postToServerSafe(message: string) {
        try {
          let data = await this.postToServer(message);
          
          let testMsgResult = `${data.status} - ${data.message}`;
          console.log(testMsgResult)
        } catch (e) {
          console.error(e);
        //   testMsgResult = "failed: " + e.message;
        }
    }
}

function formatTimestamp(date: Date) {
    return date.toISOString();
    // const formatter = new Intl.DateTimeFormat('en-GB', {
    //     year: 'numeric',
    //     month: '2-digit',
    //     day: '2-digit',
    //     hour: '2-digit',
    //     minute: '2-digit',
    //     second: '2-digit',
    //     hour12: false  // 24-hour format
    // });

    // // return formatter.format(date);
    // const parts = formatter.formatToParts(date);
    // const formattedDate = 
    //     `${parts[4].value}-${parts[2].value}-${parts[0].value}_${parts[6].value}:${parts[8].value}:${parts[10].value}`;
    //     //  yy             mm                dd                hh                mm                ss

    // return formattedDate;
}

export const logger = new Logger();