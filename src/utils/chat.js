// import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",  
  tools: [
    {
      codeExecution: {},
    },
  ],
});

// const generateCode = async (prompt, setGeneratedCode, setLoading) => {
//   setLoading(true);
//   try {
//     const response = await axios.post(
//       'https://api.openai.com/v1/chat/completions',
//       {
//         model: 'gpt-3.5-turbo',
//         messages: [
//           {
//             role: 'system',
//             content: 'You are a helpful assistant that generates code snippets, with documentation context for accesibility.',
//           },
//           {
//             role: 'user',
//             content: prompt,
//           },
//         ],
//         max_tokens: 150,
//         temperature: 0.5,
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
//         },
//       }
//     );
//     setGeneratedCode(response.data.choices[0].message.content);
//   } catch (error) {
//     console.error('Error al generar código:', error);
//   } finally {
//     setLoading(false);
//   }
// };

//const generateCode = async (prompt, setGeneratedCode, setLoading) => {
const generateCode = async (prompt, setLoading, chatHistory) => {
  setLoading(true);
  try {
    const fullPrompt = `You are a helpful assistant that generates code snippets, with documentation context for accessibility, translate your entire amswer into the following language. ${prompt}`;
    const messages = [
      { role: "user", content: prompt }, // Asegúrate de que este sea el primer mensaje
      { role: "model", content: fullPrompt }, // Este se puede agregar después
      ...chatHistory.map(message => ({ // Agrega el historial existente
        role: message.role,
        content: message.content,
      }))
    ];

    // Inicia el chat con el historial de mensajes
    const chat = await model.startChat({
      history: messages.map((message) => ({
        role: message.role,
        parts: [{ text: message.content }]
      }))
    });
    //const response = await model.generateContent(fullPrompt);
    //console.log(response.response.text());
    //setGeneratedCode(response.response.text());
    //setGeneratedCode(response.data?.embeddings[0]?.content || "No se generó código.");

    // Envía el mensaje actual y espera la respuesta
    const response = await chat.sendMessage(prompt);
    const generatedText = response.response.text();
    console.log("Generated response:", generatedText);
    return generatedText;
  } catch (error) {
    console.error("Error al generar código:", error);
    return "No se generó respuesta, intenté de nuevo más tarde.";
  } finally {
    setLoading(false);
  }
};

export default generateCode;

// const OpenAICodeGenerator = () => {
//   const [prompt, setPrompt] = useState('');
//   const [generatedCode, setGeneratedCode] = useState('');

//   const generateCode = async () => {
//     try {
//       const response = await axios.post(
//         'https://api.openai.com/v1/chat/completions',
//         {
//           model: 'gpt-3.5-turbo',
//           messages: [
//             {
//               role: 'system',
//               content: 'You are a helpful assistant that generates code snippets, with documentation context for accesibility.',
//             },
//             {
//               role: 'user',
//               content: prompt, 
//             },
//           ],
//           max_tokens: 150,
//           temperature: 0.5,
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`, 
//           },
//         }
//       );
//       setGeneratedCode(response.data.choices[0].message.content); 
//     } catch (error) {
//       console.error('Error al generar código:', error);
//     }
//   };

//   return (
//     <div>
//       <h1>Generador de Código con OpenAI</h1>
//       <textarea
//         value={prompt}
//         onChange={(e) => setPrompt(e.target.value)}
//         placeholder="Escribe una descripción del código que necesitas..."
//         rows="4"
//         cols="50"
//       />
//       <br />
//       <button onClick={generateCode}>Generar Código</button>
//       <h2>Código Generado:</h2>
//       <pre>{generatedCode}</pre>
//     </div>
//   );
// };

// export default OpenAICodeGenerator;
