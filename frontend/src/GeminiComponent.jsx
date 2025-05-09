import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateContent = async (prompt) => {
    const result = await model.generateContent(prompt);
    return result.response.text;
};

const GeminiComponent = () => {
    const [prompt, setPrompt] = useState("");
    const [aiResponse, setAiResponse] = useState("");

    const handleGenerateContent = async () => {
        const content = await generateContent(prompt);
        setAiResponse(content);
    };

    const handleInputChange = (e) => {
        setPrompt(e.target.value);
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleGenerateContent();
        }
    };

    return (
        <div className="gemini-container">
            <h2 className="gemini-head">Gemini - Ask anything...</h2>
            {/* <h3 className="ai-heading">AI Response</h3> */}
            <input
                type="text"
                value={prompt}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your input here..."
                className="input-field"
            />
            <button className='generate-button' onClick={handleGenerateContent}>
                Generate
            </button>
            <div className='ai-response'>
                <div className="gemini-output">
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {aiResponse}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default GeminiComponent;
