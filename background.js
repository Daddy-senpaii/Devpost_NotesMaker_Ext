import { GoogleGenAI } from '@google/genai';
import app from './firebase.js';
import { getFirestore, Timestamp } from "firebase/firestore";
import {doc, setDoc, addDoc} from "firebase/firestore";
import firebase from 'firebase/compat/app';
import { API_KEY } from './secret.js';


const db = getFirestore(app);

async function SetData(data_to_stored){

  try{
    const date = new Date();
    const resolvedOuptut = await data_to_stored.output
    await setDoc(doc(db, `user`, "user1"),{
  notes: resolvedOuptut, // actual notes,
  Timestamp: `${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`,
  source: data_to_stored.typeOf || "unknown",
  device: "chrome-extension",
  synced: true,

} )
console.log("successfully added");

  }catch(error){
    console.log("error",error)
  }
}



async function ProofReader(RespoMessage){
  if("Proofreader" in self){
    console.log("Yeah we have proofReader");

    const options = {
      expectedInputLanguages: ["en"],
      monitor(m){
        m.addEventListener("downloadprogress",(e)=> {
          console.log(`Downloaded ${e.loaded * 100} % `);
        })
      }
    }
    const availability = await Proofreader.availability();
    console.log(availability);
    if(availability === "unavailable"){
      console.log('Proofreader is unavailable');
      return;
    }
    const proofreader = await Proofreader.create(options);
    const proofreadResult = await proofreader.proofread(RespoMessage);
    
    const {correctedInput}  = proofreadResult;
    return(correctedInput);

  }
}

async function Summarizer_Response(RespoMessage) {
  if("Summarizer" in self){
    console.log("Yeah it is installed");
  }
  const options = {
    sharedContext : "Make well written informative notes",
    type: "key-points",
    format: "markdown",
    length: "long",
    monitor(m){
      m.addEventListener("downloadprogress",(e)=> {
        console.log(`Downloaded ${e.loaded * 100} % `);
      })
    }
  }
  const availability = await Summarizer.availability();
  if(availability === "unavailable"){
    console.log("Not downloaded");
    return;
  }
  const summarizer = await Summarizer.create(options);

  const summry = await summarizer.summarize(RespoMessage,{
    context: "This article should be intended to well infomative about the user interest.",
  })
  console.log("summry will be: ", summry);
  return summry
  

  
}

async function Writer_Response(RespoMessage){
  if("Writer" in self){
    console.log("Yeah dude it is working")
  }
  const options = {
    sharedContext: "Write a well detailed information about the topics",
    expectedInputLanguages: ["en", "ja","es"],
    expectedContextLanguages: ["en", "ja", "es"],
    outputLanguage: "en",
    tone: "casual",
    format: "markdown",
    length: "medium",
    monitor(m){
      m.addEventListener("downloadprogress",(e)=> {
        console.log(`Downloaded ${e.loaded * 100}%`)
      })
    }

  }

  const availability = await Writer.availability();
  if(availability === "unavailable"){
    return;
  }
  const writer = await Writer.create(options);
  const result = await writer.write(RespoMessage, {
    context: "Give response with well meaning and deep in context",
  });
  console.log("Response via writer api: ",result)
  return result;

  
    
  
}

const apiKey = API_KEY;  

async function analyzeImage(data) {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',  // Or 'gemini-2.0-pro' etc.; check docs for latest
      contents: [
        { inlineData: { mimeType: 'image/png', data: data.base64Data } },
        { text: `Extract and summarize key information from this screenshot as concise bullet-point notes for a notes-taking app. Focus on main elements like text, code, structure, and actions. Output only in bullet points, starting each with.Make proper study material notes so that user could understand what's going on the image.

Example input: Screenshot of a code editor with a function called "helloWorld".
Example output:
- Function name: helloWorld
- Purpose: Prints a greeting
- Language: JavaScript

Now, extract notes from this screenshot:`  }  
      ],
      config:{
        thinkingConfig:{
          thinkingBudget: 1024
        }
      }
    });

    const respoText = response.text; // Now have to preproces this thing
    console.log("Here is respo txt: ",respoText);
    const refinedSummry = await ProofReader(respoText);
    const OutputResponse =  await Summarizer_Response(refinedSummry)
    const finalWriterResponse = await Writer_Response(OutputResponse);

    console.log(finalWriterResponse);
    // Summarizer_Response(respoText);

    if(data.synced === true){
      // add to fire base cloud along with data: 
      console.log("we wiil add it to firebase cloud");
      
      const data_to_stored = {
        output: finalWriterResponse,
        typeOf: data.data_type,
      }

      await SetData(data_to_stored);
    }
    
    

  } catch (error) {
    console.error('AI Error:', error.message);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureScreen') {
    console.log("Updataed message that we getting: ", message);

    console.log('Message received');
    const base64Data = message.data.split(',')[1];  

    console.log('Base64 snippet:', base64Data.substring(0, 50) + '...');

    const data = {
      base64Data: base64Data,
      data_type: message.type,
      synced: message.synced
    }
    
    analyzeImage(data);
  }
  return true;  
});