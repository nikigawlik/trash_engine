<script lang="ts">
import type { CardInstance } from "../../modules/cardManager";
import { downloadTextFile } from "../../modules/game/utils";
import { logger } from "../../modules/logger";
import Card from "../Card.svelte";


    export let card: CardInstance;
    $: card.name = "logging";

    
    
    // TODO not here
    const baseURL = 'https://trashengine-telemetry-test.glitch.me';
    async function sendTestMSG(text?: string) {
      const url = `${baseURL}/log`;

      // The message to send to the endpoint
      let x = Math.random();
      const body = {
        message: text || 'Hello, this is a test message!' + x
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

    async function sendTestMessageSafe() {
      
      testMsgResult = ""

      try {
        let data = await sendTestMSG(msgContent);
        
        testMsgResult = `${data.status} - ${data.message}`;
      } catch (e) {
        console.error(e);
        
        testMsgResult = "failed: " + e.message;
      }
    }

    async function getLogs() {
      const url = `${baseURL}/logs`;

      // Use fetch to send a request
      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let data = await response.json();
    
      // console.log('Response from server:', data);
      return data as {message: string, timestamp: string}[];
    }

    async function getLogsSafe() {
      logsResult = "";
      try {
        let data = await getLogs();
        console.log(data);
        logsResult = data.map(m => `${m.timestamp} - ${m.message}`).join("\n");
      } catch (e) {
        console.error(e);
      }
    }

    function downloadLogs() {
        const filename = `logs_${(new Date()).toISOString()}.txt`
        downloadTextFile(filename, logsResult, "text/plain");
    }

    let msgContent = "test"
    let testMsgResult = "";
    let logsResult = "";
</script>

<Card card={card} autoFocus={true} contentMinWidth={300}>
    <h2>logs</h2>
    <p><label for="telemetryOn">telemetry on:</label><input name="telemetryOn" type="checkbox" bind:checked={logger.telemetryOn}></p>
    <p>
    <button on:click={() => sendTestMessageSafe()}>send test message</button>
    <input type="text" bind:value={msgContent} />
    </p>
    <p><span>{testMsgResult}&nbsp;</span></p>
    <p><button on:click={() => getLogsSafe() }>get logs from server</button></p>
    <pre>{logsResult}&nbsp;</pre>
    <p><button disabled={!logsResult} on:click={() => downloadLogs()}>download</button></p>
</Card>

<style>
    p, h2 {
    margin-bottom: var(--size-2);
  }

  pre {
    background: var(--off-bg-color);
    padding: var(--size-1);
  }
</style>