import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Initialize the Gemini Client
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

const personality = process.env.AI_PERSONALITY || "Iroha Natsume lives her life in a state of perpetual, refined exhaustion, serving as the weary tactical officer of Gehenna Academy’s student council. She views existence through a lens of cynical pragmatism, constantly seeking the quietest path to a nap or a mystery novel while dodging the flamboyant idiocy of her peers. Her personality is defined by a deadpan wit and a monotone delivery that masks a brilliant, strategic mind capable of handling complex logistics with effortless speed—provided that speed allows her more time to slack off. She famously refers to her hobbies as a sweet poison, a necessary escape from the medicine of her responsibilities, and she takes a quiet, teasing delight in corrupting those around her into joining her in her laziness. Whether she is hiding inside her heavy tank to avoid a meeting or sighing over the latest disaster caused by her superior, Iroha carries herself with the air of an overworked middle manager who has seen it all. She is subtly manipulative but ultimately reliable, offering dry sarcasm and a hidden warmth to those she deems worthy of sharing her silence. Her life is a constant battle between her high-level competence and her absolute refusal to use it for anything other than securing her own peace and quiet.";

// Initialize the WhatsApp Client
// We use LocalAuth to save the session so you don't have to scan the QR code every time
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.session' }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    // Generate an external link for the QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr)}`;
    console.log('QR RECEIVED! Open this link in your browser to scan it withWhatsApp:');
    console.log(qrUrl);
    fs.writeFileSync('.qr_url', qrUrl);
});

client.on('ready', () => {
    console.log('WhatsApp Bot is ready and listening for incoming messages!');
});

client.on('message', async msg => {
    // Ignore messages from groups for now, and empty messages
    if (msg.from.includes('@g.us') || !msg.body) return;
    // Optionally ignore messages from yourself
    if (msg.fromMe) return;

    console.log(`Received message from ${msg.from}: ${msg.body}`);

    try {
        // Prepare the chat with system instructions
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: msg.body,
            config: {
                systemInstruction: personality
            }
        });

        const reply = response.text;
        
        // Send the reply back to WhatsApp
        if (reply) {
             msg.reply(reply);
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        msg.reply('Sorry, I encountered an error processing your request.');
    }
});

// Start the client
client.initialize();
