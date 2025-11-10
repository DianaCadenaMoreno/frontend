// import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",  
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
      // Convert chat history to Google AI format
      const convertedHistory = chatHistory.map(message => ({
        role: message.role === 'assistant' ? 'model' : message.role,
        parts: [{ text: message.content }]
      }));
  
      // Start chat with converted history
      const chat = await model.startChat({
        history: convertedHistory
      });
  
      // Send the current message
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
