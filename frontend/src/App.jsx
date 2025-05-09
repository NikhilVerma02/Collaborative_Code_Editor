import { useEffect, useState, useRef } from 'react';
import './App.css';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import GeminiComponent from './GeminiComponent';
import toast, { Toaster } from 'react-hot-toast';
import Editor from '@monaco-editor/react';

const socket = io("https://collaborative-code-editor-ak98.onrender.com");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState("// start code here");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [output, setOutput] = useState("");
  const [version, setVersion] = useState("*");
  const fileInputRef = useRef(null);
  
    useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is Typing`);
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    });

    socket.on("codeResponse", (response) => {
      setOutput(response.run.output);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("codeResponse");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const joinRoom = () => {
    if (roomId.trim() === '' && username.trim() === '') {
      toast.error('Enter both RoomID & Username');
      return;
    }
    if (roomId.trim() === '') {
      toast.error('Please enter RoomId.');
      return;
    }
    if (username.trim() === '') {
      toast.error('Please enter Username.');
      return;
    }
    if (roomId && username) {
      socket.emit("join", { roomId, username });
      setJoined(true);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      joinRoom();
    }
  };

  const createNewRoom = (e) => {
    e.preventDefault();
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
    toast.success('New room created');
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUsername("");
    setCode("");
    setLanguage("javascript");
    setOutput("");
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, username });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
      .then(() => {
        toast.success('Copied');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  const runCode = () => {
    socket.emit("compileCode", { code, roomId, language, version });
  };

  const clearOutput = () => {
    setOutput("");
  };

  const saveCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const fileName = prompt('Enter the file name') || 'code.txt';
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const uploadCode = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newCode = e.target.result;
        const fileExtension = file.name.split('.').pop();
        let newLanguage;

        switch (fileExtension) {
          case 'js':
            newLanguage = 'javascript';
            break;
          case 'py':
            newLanguage = 'python';
            break;
          case 'java':
            newLanguage = 'java';
            break;
          case 'cpp':
            newLanguage = 'cpp';
            break;
          default:
            newLanguage = 'javascript'; // Default to JavaScript if the file extension is not recognized
        }

        setLanguage(newLanguage);
        setCode(newCode);
        socket.emit("codeChange", { roomId, code: newCode });
        socket.emit("languageChange", { roomId, language: newLanguage });
      };
      reader.readAsText(file);
    }
  };


  if (!joined) {
    return (
      // Home Page
      <div className='join-container'>
        <div className="join-form">

          <h1>Join Code Room</h1>

          <input type="text" placeholder='Room Id' value={roomId} onChange={(e) => setRoomId(e.target.value)} onKeyPress={handleKeyPress} />

          <input type="text" placeholder='User Name' value={username} onChange={(e) => setUsername(e.target.value)} onKeyPress={handleKeyPress} />
          <button onClick={joinRoom}>Join</button>
          <span className='new-room-span'>Don't have an invite then create &nbsp; 
            <a href='' className='createNewBtn' onClick={createNewRoom}>new room</a>
          </span>
          <Toaster />
        </div>
      </div>
    )
  }
  return (

    // Editor Page

    <div className='editor-container'>
      <div className="sidebar">
        <div className="room-info">
          <h2>Code Room</h2>
          <button onClick={copyRoomId} className='copy-btn'>Copy RoomId</button>
          <Toaster />
        </div>
        <h3>Users in Room</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
        <p className='typing-indigator'>{typing}</p>
        <select className='language-selector' value={language} onChange={handleLanguageChange} >
          <option value="javascript">Javascript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <button className='leave-button' onClick={leaveRoom}>Leave </button>
      </div>

      <div className="editor-wrapper">

        <div className="btn">
          <div className="btn1">
            <button className='run-code-button' onClick={runCode}>Run Code</button>
            <button onClick={clearOutput} className='clearBtn'>Clear Output</button>
          </div>
          <div className="btn2">
            <button onClick={saveCode} className='save-code-button'>Save</button>
            <button onClick={handleUploadClick} className='upload-code-button'>Upload</button>
            <input
              type="file"
              accept=".js,.txt,.py,.java,.cpp"
              onChange={uploadCode}
              className='upload-code-input'
              ref={fileInputRef}
              style={{ display: 'none' }} // Hide the file input
            />
          </div>
        </div>
        <Editor
          height="65vh"
          width="55vw"
          theme='monokoi'
          value={code}
          defaultLanguage={language}
          onChange={handleCodeChange}
          options={{
            fontSize: 18,
            fontFamily:"Roboto",
            theme:"vs-dark"
          }}
          name="editor"
        />
        

        <textarea value={output} className='output' placeholder='Output will appears here...' readOnly></textarea>
      </div>
      <div className="gemini-component">
        <GeminiComponent code={code} />
      </div>
    </div>
  )
}

export default App
