

interface LogEvent {
    message: string,
    data: any,
    timestamp: Date,
}

class Logger {
    events: LogEvent[];
    consoleLevel: "all" | "message" | "none"
    constructor(consoleLevel: typeof this.consoleLevel = "all") {
        this.events = [];
        this.consoleLevel = consoleLevel;
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
    }

    getTextLog(level: typeof this.consoleLevel) {
        const events = this.events.map(ev => 
            `${formatTimestamp(ev.timestamp)}; ${ev.message}`
            + (level == "all"? `; ${JSON.stringify(ev.data)}` : "")  // add json if level is all
        );
        const textData = events.join("\n");
        return textData;
    }
}

function formatTimestamp(date: Date) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false  // 24-hour format
    });

    // return formatter.format(date);
    const parts = formatter.formatToParts(date);
    const formattedDate = 
        `${parts[4].value}-${parts[2].value}-${parts[0].value}_${parts[6].value}:${parts[8].value}:${parts[10].value}`;
        //  yy             mm                dd                hh                mm                ss

    return formattedDate;
}

export const logger = new Logger();