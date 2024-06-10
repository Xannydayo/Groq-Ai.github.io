import './App.css'
import { requestToGroqAi } from './utils/groq'
import { useState } from 'react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs'


function App() {
  const [data, setData] = useState("")
  const [content, setContent] = useState("") // add this line
  const handleSubmit = async () => {
    const ai = await requestToGroqAi(content)
    setData(ai)
  }
  return(
    <main className='flex flex-col min-h-[80vh] justify-center items-center'>
          <h1 className='text-4xl text-center text-indigo-500'>XANNY|GROQ AI</h1>
        <form className=' w-full flex flex-col gap-4 py-4'>
          <input
          placeholder='ketik pertanyaanmu ...'
          className='border-2 border-gray-300 rounded-md p-2' 
          value={content} // add this line
          onChange={(e) => setContent(e.target.value)} // add this line
          type='text'
           ></input>
          <button 
          onClick={handleSubmit}
          type='button'
          className='bg-blue-500 text-white py-2 px-4 font-bold rounded-md'>Kirim Cuy</button>
        </form>
        <SyntaxHighlighter language='swift' style={darcula}>
          {data.toString()}
        </SyntaxHighlighter>
    </main> 

  )

}

export default App

