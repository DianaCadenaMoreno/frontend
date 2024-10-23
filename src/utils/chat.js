import axios from 'axios';

const generateCode = async (prompt, setGeneratedCode, setLoading) => {
  setLoading(true);
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates code snippets, with documentation context for accesibility.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.5,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
      }
    );
    setGeneratedCode(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error al generar código:', error);
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
