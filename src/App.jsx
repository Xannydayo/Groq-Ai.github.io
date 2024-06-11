import './App.css';
import { requestToGroqAi } from './utils/groq';
import { useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useRef } from "react";

function App() {
  const searchRef = useRef()
  const [data, setData] = useState('');
  const [content, setContent] = useState('');

  const handleSearch = (event) => {
    const keyword = searchRef.current.value
    if (keyword.trim() === "") return
    event.preventDefault()
    router.push(`/search/${keyword}`)
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault(); // Menghentikan default behavior dari tombol "Enter"
    handleSubmit(); // Memanggil fungsi handleSubmit
  }
};

  const handleSubmit = async () => {
    const ai = await requestToGroqAi(content);
    setData(ai);
  };
  return (
    <main className="flex flex-col min-h-[80vh] justify-center items-center w-full max-w-xl mx-auto">
      <h1 className="text-4xl text-center text-indigo-500">XANNY|GROQ AI</h1>
      <form className=" w-full flex flex-col gap-4 py-4">
        <input
          placeholder="ketik pertanyaanmu ..."
          className="border-2 border-gray-300 rounded-md p-2"
          value={content}
          onKeyDown={handleKeyDown}
          onChange={(e) => setContent(e.target.value)}
          type="text"
        ></input>
        <button
          onClick={handleSubmit}
          type="button"
          className="bg-blue-500 text-white py-2 px-4 font-bold rounded-md"
        >
          Kirim Cuy
        </button>
      </form>
      <div className="max-w-xl w-full mx-auto">
        <SyntaxHighlighter
          language="swift"
          style={darcula}
          wrapLongLines
        >
          {data.toString()}
        </SyntaxHighlighter>
      </div>
    </main>
  );
}

export default App;
